// src/pages/communaute/private/community-details/tabs/about/AboutTabPublic.tsx
import { Loader2, Lock, Send, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadSession } from "../../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../../lib/api";
import {
  useCommunitySubscription,
  type SubscriptionStatus,
} from "../../hooks/useCommunitySubscription";
import ImageLightbox from "../CommunityProfil/ImageLightbox";

type PublicCommunity = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  logoUrl?: string;
  category?: string;
  visibility?: "public" | "private";
};

type RequestsMyResponse =
  | {
      ok: true;
      data: {
        items: {
          community: {
            id: string;
            slug?: string;
          } | null;
          status: "pending" | "approved" | "rejected";
        }[];
      };
    }
  | { ok: false; error: string };

type MembershipsMyResponse =
  | { ok: true; data: { communityIds: string[] } }
  | { ok: false; error: string };

export default function AboutTabPublic({
  loading,
  error,
  community,
  isMember,
  isOwner,
  onJoin,
  onLeave,
  leaving = false,
}: {
  loading: boolean;
  error: string | null;
  community: PublicCommunity | null;
  isMember: boolean;
  isOwner: boolean;
  onJoin?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  leaving?: boolean;
}) {
  const initialStatus: SubscriptionStatus = isMember ? "approved" : "none";

  const {
    status: localStatus,
    setStatus: setLocalStatus,
    busy: localBusy,
    join,
    leave,
  } = useCommunitySubscription(initialStatus);

  // 🔍 Lightbox (même système que l’admin)
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // 👉 on synchronise aussi quand la prop isMember change
  useEffect(() => {
    setLocalStatus(isMember ? "approved" : "none");
  }, [isMember, setLocalStatus]);

  // 👉 Récupération du vrai statut (memberships + requests)
  useEffect(() => {
    if (!community) return;

    const token = loadSession()?.token;
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const [mRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/communaute/memberships/my`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${API_BASE}/communaute/requests/my`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        const mJson = (await mRes.json()) as MembershipsMyResponse;
        const rJson = (await rRes.json()) as RequestsMyResponse;

        if (cancelled) return;

        const currentId = community.id ? String(community.id) : null;
        const currentSlug = community.slug ? String(community.slug) : null;

        let matchedApproved = false;
        if (mJson.ok && currentId) {
          matchedApproved = mJson.data.communityIds.some(
            (id) => String(id) === currentId
          );
        }

        let matchedPending = false;
        if (rJson.ok) {
          for (const it of rJson.data.items) {
            const c = it.community;
            if (!c) continue;

            const sameId = currentId && String(c.id) === currentId;
            const sameSlug =
              currentSlug && typeof c.slug === "string"
                ? c.slug === currentSlug
                : false;

            if (sameId || sameSlug) {
              if (it.status === "approved") {
                matchedApproved = true;
              } else if (it.status === "pending") {
                matchedPending = true;
              }
            }
          }
        }

        if (matchedApproved) {
          setLocalStatus("approved");
        } else if (matchedPending) {
          setLocalStatus("pending");
        } else {
          setLocalStatus("none");
        }
      } catch {
        // on garde le statut actuel en cas d’erreur
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [community, setLocalStatus]);

  // ⚠️ Tous les hooks sont déjà passés AU-DESSUS.

  // cover / logo affichés
  const cover =
    community?.coverUrl ||
    "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1600&q=60";

  const logo =
    community?.logoUrl ||
    "https://avatar.iran.liara.run/public/boy?width=256&height=256&background=0f172a&color=fff";

  // 👉 vrai fichier ou image par défaut ?
  const hasRealCover = Boolean(community?.coverUrl);
  const hasRealLogo = Boolean(community?.logoUrl);

  const isPrivate = community?.visibility === "private";
  const visibility: "public" | "private" = isPrivate ? "private" : "public";

  // images pour le viewer (cover + logo)
  const lbImages = useMemo(
    () => [
      { src: cover, alt: community?.name || "Couverture" },
      { src: logo, alt: community?.name || "Logo" },
    ],
    [cover, logo, community?.name]
  );

  const handleJoin = async () => {
    if (localBusy || leaving) return;
    await join(visibility, onJoin);
  };

  const handleLeave = async () => {
    if (localBusy || leaving) return;
    await leave(onLeave);
  };

  // 👉 n’ouvre le lightbox que si vraie image
  const openLightbox = (index: number) => {
    if (index === 0 && !hasRealCover) return;
    if (index === 1 && !hasRealLogo) return;
    setLbIndex(index);
    setLbOpen(true);
  };

  // 🧱 Les returns arrivent APRÈS tous les hooks

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">
        Impossible d’afficher la communauté.
      </div>
    );
  }

  if (!community) {
    return (
      <div className="py-12 text-center text-slate-400">
        Communauté introuvable.
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* 1. couverture pleine largeur (cliquable seulement si vraie cover) */}
      {/* 1. couverture pleine largeur (cliquable) */}
      <div className="rounded-3xl bg-slate-100 dark:bg-slate-900/50 ring-1 ring-slate-100 dark:ring-slate-900/40">
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative h-52 sm:h-60 md:h-72 lg:h-80 w-full group overflow-hidden rounded-3xl"
        >
          <img
            src={cover}
            alt={community.name || "Couverture"}
            className="h-full w-full object-cover rounded-3xl transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="sr-only">Agrandir la photo de couverture</span>
        </button>
      </div>

      {/* 2. bloc infos */}
      <div className="mt-6 bg-white dark:bg-slate-900/40 rounded-3xl ring-1 ring-slate-100 dark:ring-slate-900/40 px-4 sm:px-6 md:px-8 py-6 sm:py-7">
        <div className="flex gap-4 sm:gap-6 items-start justify-between">
          {/* gauche */}
          <div className="flex gap-4 sm:gap-5 items-start">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white overflow-hidden ring-4 ring-white dark:ring-slate-950 shadow-xl shrink-0">
              <button
                type="button"
                onClick={() => openLightbox(1)}
                className={`h-full w-full ${
                  hasRealLogo ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <img
                  src={logo}
                  alt={community.name || "Logo"}
                  className="h-full w-full object-cover"
                />
                <span className="sr-only">Agrandir la photo de profil</span>
              </button>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                {community.name}
              </h1>
              {community.slug ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  /communaute/{community.slug}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {community.category ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {community.category}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {isPrivate ? "Communauté privée" : "Communauté publique"}
                </span>
              </div>
            </div>
          </div>

          {/* droite : bouton */}
          <div className="shrink-0">
            {isOwner ? (
              <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-200 px-3 py-1 text-sm font-medium">
                Vous êtes l’admin
              </span>
            ) : localStatus === "approved" ? (
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaving || localBusy}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition border ${
                  leaving || localBusy
                    ? "bg-rose-200/40 text-rose-600 dark:text-rose-200 cursor-not-allowed"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-200 border-rose-200/40 dark:border-rose-500/30 hover:bg-rose-500/20"
                }`}
              >
                {leaving || localBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Désabonnement…
                  </>
                ) : (
                  "Se désabonner"
                )}
              </button>
            ) : localStatus === "pending" ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-full bg-violet-500/10 text-violet-200 px-4 py-2 text-sm font-semibold border border-violet-400/40"
              >
                <Check className="w-4 h-4 mr-2" />
                Demande envoyée
              </button>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={localBusy}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition text-white ${
                  localBusy
                    ? "bg-violet-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {localBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Traitement…
                  </>
                ) : isPrivate ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Demander l’accès
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Rejoindre la communauté
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* description */}
        {community.description ? (
          <div className="mt-5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200">
            {community.description}
          </div>
        ) : (
          <div className="mt-5 text-sm text-slate-400 dark:text-slate-500">
            Aucune description fournie.
          </div>
        )}
      </div>

      {/* Lightbox plein écran pour logo / cover */}
      <ImageLightbox
        open={lbOpen}
        images={lbImages}
        startAt={lbIndex}
        onClose={() => setLbOpen(false)}
      />
    </div>
  );
}
