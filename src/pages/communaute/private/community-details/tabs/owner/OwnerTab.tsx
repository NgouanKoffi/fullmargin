// src/pages/communaute/private/community-details/tabs/CommunityProfil/owner/OwnerTab.tsx
import { useEffect, useMemo, useState } from "react";
import { loadSession } from "../../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../../lib/api";
import OwnerPublicView from "./OwnerPublicView";
import OwnerAdminView from "./OwnerAdminView";

type PublicUserDTO = {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role?: string;
  isPlatformAdmin?: boolean;
};

type ProfileExtraDTO = {
  profile: {
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    bio?: string;
  };
};

export type OwnerView = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
};

// shape renvoyé par ton backend
export type CommunityStatsDTO = {
  ok: boolean;
  data?: {
    communityId: string;
    name: string;
    owner: { id: string; fullName: string; avatarUrl: string } | null;
    counts: {
      subscribers: number;
      posts: number;
      comments: number;
      reviews: number;
      likes: number;
      membersFromCommunity: number;
    };
    ratings: {
      average: number | null;
      totalReviews: number;
    };
    timelines: {
      members: { date: string; count: number }[];
      posts: { date: string; count: number }[];
      comments: { date: string; count: number }[];
    };
    meta: {
      days: number;
      generatedAt: string;
    };
  };
};

function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getErrMsg(status: number, fallback = "Erreur de chargement"): string {
  if (status === 401) return "Non autorisé. Veuillez vous reconnecter.";
  if (status === 403) return "Accès interdit.";
  if (status === 404) return "Introuvable.";
  return `${fallback} (HTTP ${status})`;
}

export default function OwnerTab({
  ownerId,
  communityId,
}: {
  ownerId?: string;
  communityId?: string;
}) {
  const [owner, setOwner] = useState<OwnerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  // stats
  const [stats, setStats] = useState<CommunityStatsDTO["data"] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  // 1) on charge le profil (comme avant)
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      const isPublicView =
        typeof ownerId === "string" && ownerId.trim().length > 0;

      try {
        const headersBase = {
          Accept: "application/json",
          "Cache-Control": "no-store",
        };

        const userReq = isPublicView
          ? fetch(`${base}/users/public/${encodeURIComponent(ownerId!)}`, {
              headers: headersBase,
              signal: ac.signal,
            })
          : fetch(`${base}/auth/me`, {
              headers: { ...headersBase, ...authHeaders() },
              signal: ac.signal,
            });

        const extraReq = isPublicView
          ? fetch(
              `${base}/profile/extra/public/${encodeURIComponent(ownerId!)}`,
              {
                headers: headersBase,
                signal: ac.signal,
              }
            )
          : fetch(`${base}/profile/extra`, {
              headers: { ...headersBase, ...authHeaders() },
              signal: ac.signal,
            });

        const [userRes, extraRes] = await Promise.all([userReq, extraReq]);

        if (!userRes.ok) {
          throw new Error(getErrMsg(userRes.status, "Lecture profil"));
        }

        const userJson = await safeJson<PublicUserDTO>(userRes);
        const extraJson = extraRes.ok
          ? await safeJson<ProfileExtraDTO>(extraRes)
          : null;

        if (cancelled) return;

        if (!userJson) {
          setOwner(null);
          setErr("Utilisateur introuvable.");
          setLoading(false);
          return;
        }

        const adminDetected =
          userJson.isPlatformAdmin === true ||
          userJson.role === "admin" ||
          userJson.role === "superadmin";
        setIsPlatformAdmin(!isPublicView && adminDetected);

        const fullName = (
          extraJson?.profile.fullName ||
          userJson.fullName ||
          ""
        ).trim();
        const email = (extraJson?.profile.email || userJson.email || "").trim();
        const { firstName, lastName } = splitName(fullName);

        setOwner({
          fullName,
          firstName,
          lastName,
          email,
          phone: extraJson?.profile.phone || "",
          bio: extraJson?.profile.bio || "",
          avatarUrl: userJson.avatarUrl || "",
          coverUrl: userJson.coverUrl || "",
        });
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setErr(typeof e?.message === "string" ? e.message : "Erreur réseau");
        setOwner(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [ownerId, base]);

  // 2) si on est admin et qu’on a un communityId → on charge les stats
  useEffect(() => {
    if (!isPlatformAdmin) return;
    if (!communityId) return;

    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      setStatsLoading(true);
      setStatsErr(null);
      try {
        const res = await fetch(
          `${base}/communaute/${encodeURIComponent(communityId)}/stats`,
          {
            headers: {
              Accept: "application/json",
              ...authHeaders(),
            },
            signal: ac.signal,
          }
        );
        if (!res.ok) {
          throw new Error(getErrMsg(res.status, "Lecture des statistiques"));
        }
        const json = await safeJson<CommunityStatsDTO>(res);
        if (cancelled) return;
        if (!json?.ok) {
          setStatsErr("Statistiques indisponibles.");
          setStats(null);
        } else {
          setStats(json.data ?? null);
        }
      } catch (e: any) {
        if (cancelled) return;
        setStatsErr(
          typeof e?.message === "string" ? e.message : "Erreur réseau"
        );
        setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [isPlatformAdmin, communityId, base]);

  // rendu
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        Chargement…
      </div>
    );
  }

  if (err || !owner) {
    return (
      <div className="rounded-2xl bg-white/90 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 p-6 text-center">
        {err || "Aucune information propriétaire trouvée."}
      </div>
    );
  }

  if (isPlatformAdmin) {
    return (
      <OwnerAdminView
        owner={owner}
        stats={stats}
        statsLoading={statsLoading}
        statsErr={statsErr}
      />
    );
  }

  return <OwnerPublicView owner={owner} />;
}
