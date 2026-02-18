// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\index\postFromNotification.ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "../../../../lib/api";
import { loadSession } from "../../../../auth/lib/storage";
import type { PostLite, Media } from "../../public/components/feed/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// on normalise le post pour CommentsModal
export function normalizePostFromApi(raw: unknown): PostLite | null {
  if (!isRecord(raw)) return null;

  const id =
    (typeof raw.id === "string" && raw.id) ||
    (typeof raw._id === "string" && raw._id) ||
    null;
  if (!id) return null;

  const content =
    (typeof raw.content === "string" && raw.content) ||
    (typeof raw.text === "string" && raw.text) ||
    "";

  const createdAt =
    (typeof raw.createdAt === "string" && raw.createdAt) ||
    new Date().toISOString();

  const authorRaw = isRecord(raw.author)
    ? raw.author
    : isRecord(raw.user)
    ? raw.user
    : null;
  const author = authorRaw
    ? {
        id:
          (typeof authorRaw.id === "string" && authorRaw.id) ||
          (typeof authorRaw._id === "string" && authorRaw._id) ||
          undefined,
        name:
          (typeof authorRaw.name === "string" && authorRaw.name) ||
          (typeof authorRaw.fullName === "string" && authorRaw.fullName) ||
          "Utilisateur",
        avatar:
          (typeof authorRaw.avatar === "string" && authorRaw.avatar) ||
          (typeof authorRaw.avatarUrl === "string" && authorRaw.avatarUrl) ||
          "",
      }
    : {
        name: "Utilisateur",
        avatar: "",
      };

  const mediaRaw = Array.isArray(raw.media) ? raw.media : [];

  const media: Media[] = mediaRaw
    .map((m): Media | null => {
      if (!isRecord(m)) return null;
      const url =
        (typeof m.url === "string" && m.url) ||
        (typeof m.src === "string" && m.src) ||
        "";
      if (!url) return null;
      const type =
        (typeof m.type === "string" && m.type) ||
        (typeof m.kind === "string" && m.kind) ||
        "image";
      return {
        type: type === "video" ? "video" : "image",
        url,
        thumbnail:
          (typeof m.thumbnail === "string" && m.thumbnail) || undefined,
      };
    })
    .filter((m): m is Media => m !== null);

  const likes =
    typeof raw.likes === "number"
      ? raw.likes
      : typeof raw.likesCount === "number"
      ? raw.likesCount
      : 0;

  const comments =
    typeof raw.comments === "number"
      ? raw.comments
      : typeof raw.commentsCount === "number"
      ? raw.commentsCount
      : 0;

  return {
    id,
    content,
    media: media.length > 0 ? media : undefined,
    author,
    createdAt,
    likes,
    comments,
  };
}

// ✅ Ajout: on écoute aussi l'URL "postId"
export function usePostFromNotification(communityId?: string) {
  const [openPostModal, setOpenPostModal] = useState(false);
  const [postFromNotif, setPostFromNotif] = useState<PostLite | null>(null);
  const [loadingPostFromNotif, setLoadingPostFromNotif] = useState(false);

  // Pour lire l'URL
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPostId = searchParams.get("postId");

  // Fonction commune pour charger un post
  const loadPost = async (postId: string, cId?: string) => {
      const base = API_BASE.replace(/\/+$/, "");
      const session = (loadSession() as { token?: string } | null) ?? null;
      const token = session?.token;

      setLoadingPostFromNotif(true);
      setPostFromNotif(null);
      setOpenPostModal(true); // on ouvre tout de suite en mode loading

      try {
        const qs = new URLSearchParams({
          page: "1",
          limit: "200",
        });
        if (cId) qs.set("communityId", cId);

        const res = await fetch(`${base}/communaute/posts?${qs.toString()}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("list_failed");

        const j = await res.json().catch(() => null);
        const items = j?.data?.items || [];
        const found = items.find((p: { id?: string }) => p.id === postId);

        if (!found) {
          window.dispatchEvent(
            new CustomEvent("fm:toast", {
              detail: {
                title: "Publication introuvable",
                message:
                  "La publication liée à cette notification n’est plus disponible.",
                tone: "warning",
              },
            })
          );
          setOpenPostModal(false);
          return;
        }

        const normalized = normalizePostFromApi(found);
        if (!normalized) {
          setOpenPostModal(false);
          return;
        }

        setPostFromNotif(normalized);
      } catch (err) {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Erreur",
              message: "Impossible de charger la publication.",
              tone: "error",
            },
          })
        );
        setOpenPostModal(false);
      } finally {
        setLoadingPostFromNotif(false);
      }
  };

  // 1. Écouteur d'événement (Legacy ou interne)
  useEffect(() => {
    const handler = (
      e: Event & {
        detail?: { postId?: string; communityId?: string };
      }
    ) => {
      const detail = e.detail;
      if (!detail?.postId) return;
      loadPost(detail.postId, detail.communityId || communityId);
    };

    window.addEventListener("fm:community:open-post", handler as EventListener);
    return () => {
      window.removeEventListener(
        "fm:community:open-post",
        handler as EventListener
      );
    };
  }, [communityId]);

  // 2. Écouteur d'URL (Deep link)
  useEffect(() => {
    if (urlPostId && communityId) {
      loadPost(urlPostId, communityId);
    }
  }, [urlPostId, communityId]);

  const closePostModal = () => {
    setOpenPostModal(false);
    // On nettoie l'URL si besoin
    if (urlPostId) {
      const next = new URLSearchParams(searchParams);
      next.delete("postId");
      setSearchParams(next, { replace: true });
    }
  };

  return {
    openPostModal,
    postFromNotif,
    loadingPostFromNotif,
    closePostModal,
  };
}