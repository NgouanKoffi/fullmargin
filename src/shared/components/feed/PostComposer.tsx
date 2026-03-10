// src/pages/communaute/private/community-details/tabs/PostComposer/index.tsx

import { useEffect, useState } from "react";
import type {
  CreatePayload,
  ExistingMedia,
  Visibility,
} from "./PostComposer/types";
import { loadSession } from "@core/auth/lib/storage";
import Trigger from "./PostComposer/Trigger";
import FullscreenEditor from "./PostComposer/FullscreenEditor";
import { isApiStd, openAuthModal, safeParseJson } from "./PostComposer/helpers";
import { API_BASE } from "@core/api/client";

type Props = {
  onCreate?: (
    payload: CreatePayload
  ) => Promise<{ ok: boolean; message?: string }>;

  /**
   * true  = l’utilisateur peut programmer + choisir privé/public
   * false = tout est forcé en privé, pas de programmation
   */
  canManageVisibilityAndSchedule?: boolean;
};

export default function PostComposer({
  onCreate,
  canManageVisibilityAndSchedule = false, // 🔐 par défaut : personne ne gère ça
}: Props) {
  const [fsOpen, setFsOpen] = useState(false);

  // mode édition
  const [editId, setEditId] = useState<string | null>(null);
  const [initialText, setInitialText] = useState<string>("");
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [initialVisibility, setInitialVisibility] =
    useState<Visibility>("private");

  // helper : applique la règle de visibilité en fonction des droits
  const computeVisibility = (v?: Visibility | null): Visibility => {
    if (!canManageVisibilityAndSchedule) return "private";
    return v === "public" || v === "private" ? v : "private";
  };

  // ouvrir depuis ailleurs (nouveau post)
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<{ text?: string; visibility?: Visibility }>;
      setEditId(null);
      setInitialText((ce.detail?.text ?? "").toString());
      setExistingMedia([]);
      // 🔐 si pas admin → toujours privé
      setInitialVisibility(computeVisibility(ce.detail?.visibility));
      setFsOpen(true);
    };

    window.addEventListener("fm:open-post-composer", onOpen);
    return () => window.removeEventListener("fm:open-post-composer", onOpen);
  }, [canManageVisibilityAndSchedule]);

  // ouvrir en mode edit
  useEffect(() => {
    const onEdit = (e: Event) => {
      const ce = e as CustomEvent<{
        id: string;
        content: string;
        visibility?: Visibility;
        media?: Array<{
          type: "image" | "video";
          url: string;
          thumbnail?: string;
          publicId?: string;
        }>;
      }>;

      if (!ce.detail?.id) return;

      setEditId(ce.detail.id);
      setInitialText(ce.detail.content || "");

      // médias existants
      setExistingMedia(
        (ce.detail.media || []).map((m) => ({
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnail || "",
          publicId: m.publicId || "",
          _removed: false,
        }))
      );

      // 🔐 si user pas admin → même en édition, on force privé
      setInitialVisibility(computeVisibility(ce.detail.visibility));

      setFsOpen(true);
    };

    window.addEventListener("fm:community:post:edit", onEdit);
    return () => window.removeEventListener("fm:community:post:edit", onEdit);
  }, [canManageVisibilityAndSchedule]);

  return (
    <>
      <Trigger onOpen={() => setFsOpen(true)} />

      {fsOpen && (
        <FullscreenEditor
          modeEditId={editId}
          initialText={initialText}
          initialExisting={existingMedia}
          initialVisibility={initialVisibility}
          // 🔐 FullscreenEditor saura masquer ou non les blocs
          canManageVisibilityAndSchedule={canManageVisibilityAndSchedule}
          onClose={() => {
            setFsOpen(false);
            setEditId(null);
            setInitialText("");
            setExistingMedia([]);
            setInitialVisibility("private");
          }}
          onPublish={async (payload, mediaOps) => {
            const token = (loadSession() as { token?: string } | null)?.token;
            if (!token) {
              openAuthModal("signin");
              return;
            }

            const base = API_BASE.replace(/\/+$/, "");

            // 🔐 sécurité front : on écrase toujours la visibility/scheduledAt
            const finalVisibility: Visibility = computeVisibility(
              payload.visibility
            );
            const finalScheduledAt =
              canManageVisibilityAndSchedule &&
              payload.scheduledAt !== undefined
                ? payload.scheduledAt
                : null;

            /* -------------- MODE EDIT -------------- */
            if (editId) {
              // sans changement de médias
              if (!mediaOps) {
                const body: Record<string, unknown> = {
                  content: payload.text,
                  visibility: finalVisibility,
                };

                if (canManageVisibilityAndSchedule) {
                  // seulement admin / owner peut programmer
                  if (finalScheduledAt !== undefined) {
                    body.scheduledAt = finalScheduledAt;
                  }
                }

                const url = `${base}/communaute/posts/${editId}`;
                const res = await fetch(url, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(body),
                  cache: "no-store",
                });

                const parsed = await safeParseJson(res);
                const okFlag = isApiStd(parsed) ? !!parsed.ok : res.ok;

                if (okFlag) {
                  window.dispatchEvent(
                    new CustomEvent("fm:community:post:updated", {
                      detail: {
                        id: editId,
                        content: payload.text,
                        visibility: finalVisibility,
                      },
                    })
                  );

                  setFsOpen(false);
                  setEditId(null);
                  setInitialText("");
                  setExistingMedia([]);
                } else {
                  alert("Mise à jour impossible.");
                }
                return;
              }

              // avec médias
              const url = `${base}/communaute/posts/${editId}/media`;
              const fd = new FormData();

              for (const f of payload.files) fd.append("media", f);
              fd.append("content", payload.text ?? "");
              fd.append("keep", JSON.stringify(mediaOps.keepPublicIds));
              fd.append("visibility", finalVisibility);

              if (canManageVisibilityAndSchedule) {
                if (finalScheduledAt !== undefined) {
                  fd.append(
                    "scheduledAt",
                    finalScheduledAt === null ? "" : finalScheduledAt
                  );
                }
              }

              const res = await fetch(url, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
              });

              const parsed = await safeParseJson(res);
              const okFlag = isApiStd(parsed) ? !!parsed.ok : res.ok;

              if (okFlag) {
                window.dispatchEvent(
                  new CustomEvent("fm:community:post:updated", {
                    detail: {
                      id: editId,
                      content: payload.text,
                      visibility: finalVisibility,
                    },
                  })
                );

                setFsOpen(false);
                setEditId(null);
                setInitialText("");
                setExistingMedia([]);
              } else {
                alert("Mise à jour des médias impossible.");
              }
              return;
            }

            /* -------------- MODE CRÉATION -------------- */
            if (!onCreate) return;

            const cleanPayload: CreatePayload = {
              text: payload.text,
              files: payload.files,
              // pour les abonnés : forcément null
              scheduledAt: finalScheduledAt,
              visibility: finalVisibility,
            };

            const r = await onCreate(cleanPayload);
            if (r?.ok) {
              setFsOpen(false);
              setInitialVisibility("private");
            } else {
              alert(r?.message || "Création impossible.");
            }
          }}
        />
      )}
    </>
  );
}
