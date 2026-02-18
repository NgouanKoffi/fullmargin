// src/pages/communaute/private/community-details/hooks/useCommunityDetails.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../../../../lib/api";
import { fetchMyCommunity } from "../services/community.service";

type Status = "authenticated" | "unauthenticated" | "anonymous" | "loading";

type User = {
  id?: string;
} | null;

export type Community = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  visibility?: "public" | "private";
  coverUrl?: string;
  logoUrl?: string;
  ownerId?: string;
  allowSubscribersPosts?: boolean;
};

type ApiDetail = { ok: true; data: Community } | { ok: false; error: string };

export function useCommunityDetails({
  slug,
  status,
  user,
}: {
  slug: string;
  status: Status;
  user: User;
}) {
  const isSelfSpace = slug === "mon-espace";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);

  const wasAuthenticatedRef = useRef(status === "authenticated");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isSelfSpace) {
          // on caste pour récupérer allowSubscribersPosts tranquillement
          const mine = (await fetchMyCommunity().catch(() => null)) as
            | (Community & { allowSubscribersPosts?: boolean })
            | null;
          if (cancelled) return;
          if (mine?.slug) {
            setCommunity({
              id: mine.id,
              slug: mine.slug,
              name: mine.name || "",
              description: mine.description || "",
              category: mine.category || "",
              visibility: mine.visibility || "public",
              coverUrl: mine.coverUrl || "",
              logoUrl: mine.logoUrl || "",
              ownerId: user?.id ?? "",
              allowSubscribersPosts: !!mine.allowSubscribersPosts,
            });
          } else {
            setCommunity(null);
          }
        } else {
          const res = await fetch(
            `${API_BASE}/communaute/communities/by-slug/${encodeURIComponent(
              slug
            )}`,
            { cache: "no-store" }
          );
          const json = (await res.json()) as ApiDetail;
          if (cancelled) return;
          if (json.ok) {
            setCommunity({
              ...json.data,
              name: json.data.name || "",
              allowSubscribersPosts: !!json.data.allowSubscribersPosts,
            });
          } else {
            setError(json.error || "Introuvable");
          }
        }
      } catch {
        if (!cancelled) setError("Connexion au serveur impossible.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, isSelfSpace, status, user?.id]);

  const isOwner = useMemo(() => {
    if (!community) return isSelfSpace && status === "authenticated";
    if (status !== "authenticated") return false;
    return (
      String(user?.id ?? "") === String(community.ownerId ?? user?.id ?? "")
    );
  }, [community, status, user, isSelfSpace]);

  useEffect(() => {
    if (community && isOwner && community.slug) {
      try {
        sessionStorage.setItem("fm:community:my-slug", community.slug);
        window.dispatchEvent(new Event("fm:community-refresh"));
      } catch {
        /* ignore */
      }
    }
  }, [community, isOwner]);

  useEffect(() => {
    const was = wasAuthenticatedRef.current;
    const nowIsAuth = status === "authenticated";
    if (was && !nowIsAuth) {
      window.location.href = "/";
      return;
    }
    wasAuthenticatedRef.current = nowIsAuth;
  }, [status]);

  const requireAuth = useCallback(() => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
    );
  }, []);

  const joinFromDetails = useCallback(
    async (note?: string) => {
      if (!community?.id) return;
      try {
        const raw = localStorage.getItem("fm:session");
        const tok: string | undefined = raw ? JSON.parse(raw).token : undefined;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (tok) headers.Authorization = `Bearer ${tok}`;
        await fetch(`${API_BASE}/communaute/memberships/join`, {
          method: "POST",
          headers,
          body: JSON.stringify({ communityId: community.id, note: note || "" }),
        });
      } catch {
        /* ignore */
      }
    },
    [community?.id]
  );

  return {
    community,
    loading,
    error,
    isSelfSpace,
    isOwner,
    requireAuth,
    joinFromDetails,
  };
}
