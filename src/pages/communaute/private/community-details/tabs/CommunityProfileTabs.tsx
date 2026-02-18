// src/pages/communaute/private/community-details/tabs/CommunityProfileTabs.tsx
import { useMemo, useState, useEffect } from "react";
import {
  UserCircle2,
  Info,
  Footprints,
  Clock,
  Send,
  Lock,
  Copy,
  Check,
} from "lucide-react";
import AboutTab from "./about/AboutTab";
import OwnerTab, {
  type OwnerView,
  type CommunityStatsDTO,
} from "./owner/OwnerTab";
import OwnerAdminView from "./owner/OwnerAdminView";
import ImageLightbox from "./CommunityProfil/ImageLightbox";
import { loadSession } from "../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../lib/api";
import {
  useCommunitySubscription,
  type SubscriptionStatus,
} from "../hooks/useCommunitySubscription";

/* ================= types ================= */

type Community = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  visibility?: "public" | "private";
  coverUrl?: string;
  logoUrl?: string;
  ownerId?: string;
};

type Props = {
  community: Community;
  isOwner: boolean;
  visitorStatus?: "none" | "pending" | "approved";
  onVisitorJoin?: (note?: string) => Promise<void> | void;
  ctaBusy?: boolean;
  onVisitorLeave?: () => Promise<void> | void;
  visitorLeaving?: boolean;
};

type LocalTabKey = "about" | "owner" | "visits";

/* ============== sous-vue “À propos” (visiteur) ============== */
function AboutTabWrapper({
  community,
  readOnly,
  visitorStatus = "none",
  onVisitorJoin,
  ctaBusy,
  onVisitorLeave,
  visitorLeaving,
}: {
  community: Community;
  readOnly: boolean;
  visitorStatus?: "none" | "pending" | "approved";
  onVisitorJoin?: (note?: string) => void | Promise<void>;
  ctaBusy?: boolean;
  onVisitorLeave?: () => void | Promise<void>;
  visitorLeaving?: boolean;
}) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const {
    status: localVisitorStatus,
    busy: localBusy,
    join,
    leave,
  } = useCommunitySubscription(visitorStatus as SubscriptionStatus);

  const {
    coverUrl,
    logoUrl,
    name,
    slug,
    category,
    visibility = "public",
    description,
  } = community;

  const hasCustomCover = Boolean(coverUrl);
  const hasCustomLogo = Boolean(logoUrl);

  const coverSrc =
    coverUrl ||
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop";
  const logoSrc =
    logoUrl || "https://api.dicebear.com/8.x/shapes/svg?seed=FMCommunity";

  const gallery = useMemo(
    () => [
      { src: coverSrc, alt: "Image de couverture" },
      { src: logoSrc, alt: "Logo" },
    ],
    [coverSrc, logoSrc]
  );

  const lbImages = useMemo(() => gallery, [gallery]);

  const visLabel =
    visibility === "private" ? "Communauté privée" : "Communauté publique";

  const openAt = (i: number) => {
    setLbIndex(i);
    setLbOpen(true);
  };

  const handleCTA = async () => {
    if (
      ctaBusy ||
      localBusy ||
      visitorLeaving ||
      localVisitorStatus === "pending"
    ) {
      return;
    }

    if (localVisitorStatus === "approved") {
      await leave(onVisitorLeave);
      return;
    }

    await join(visibility, onVisitorJoin);
  };

  const handleCopy = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/communaute/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const showJoinButton = localVisitorStatus === "none";
  const isPending = localVisitorStatus === "pending";

  if (!readOnly) {
    return <AboutTab viewMode="admin" />;
  }

  return (
    <div className="overflow-visible rounded-3xl bg-transparent">
      <div className="relative">
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 ring-1 ring-slate-100/60 dark:ring-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-black/40">
          {hasCustomCover ? (
            <button
              type="button"
              className="block w-full"
              onClick={() => openAt(0)}
            >
              <div className="w-full h-64 sm:h-72 md:h-80 lg:h-[22rem]">
                <img
                  src={coverSrc}
                  alt="Couverture"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ) : (
            <div className="w-full h-64 sm:h-72 md:h-80 lg:h-[22rem]">
              <img
                src={coverSrc}
                alt="Couverture"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />
        </div>

        <div className="absolute left-6 -bottom-14 z-10">
          {hasCustomLogo ? (
            <button
              type="button"
              onClick={() => openAt(1)}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-white dark:ring-slate-900/80 overflow-hidden shadow-2xl bg-slate-900/20"
            >
              <img
                src={logoSrc}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-white dark:ring-slate-900/80 overflow-hidden shadow-2xl bg-slate-900/20">
              <img
                src={logoSrc}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-20">
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/70 backdrop-blur border border-white/40 dark:border-white/10 shadow-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300 break-all">
                <p>/communaute/{slug}</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Copier le lien"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {category || "Sans catégorie"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {visLabel}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 sm:items-end">
              <button
                type="button"
                disabled={ctaBusy || localBusy || visitorLeaving || isPending}
                onClick={handleCTA}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  ctaBusy || localBusy || visitorLeaving
                    ? "bg-violet-400 cursor-not-allowed"
                    : isPending
                    ? "bg-violet-500/70 cursor-not-allowed"
                    : showJoinButton
                    ? "bg-violet-600 hover:bg-violet-700 shadow-violet-600/25"
                    : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25"
                }`}
              >
                {ctaBusy || localBusy || visitorLeaving ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Traitement…
                  </>
                ) : isPending ? (
                  <>
                    <Check className="h-4 w-4" />
                    Demande envoyée
                  </>
                ) : showJoinButton ? (
                  <>
                    {visibility === "private" ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {visibility === "private"
                      ? "Demander l’accès"
                      : "Rejoindre la communauté"}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Se désabonner
                  </>
                )}
              </button>
            </div>
          </div>

          {description ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <ImageLightbox
        open={lbOpen}
        images={lbImages}
        startAt={lbIndex}
        onClose={() => setLbOpen(false)}
      />
    </div>
  );
}

/* ================= composant principal ================= */

export default function CommunityProfileTabs({
  community,
  isOwner,
  visitorStatus = "none",
  onVisitorJoin,
  ctaBusy,
  onVisitorLeave,
  visitorLeaving,
}: Props) {
  const [tab, setTab] = useState<LocalTabKey>("about");

  const currentUserId = useMemo(() => {
    try {
      const s = loadSession() as unknown;
      if (s && typeof s === "object") {
        const obj = s as { user?: { id?: string }; userId?: string };
        return obj.user?.id || obj.userId || null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const effectiveIsOwner = useMemo(() => {
    if (!community?.ownerId) {
      return false;
    }
    if (currentUserId) {
      return String(community.ownerId) === String(currentUserId);
    }
    return isOwner;
  }, [community?.ownerId, currentUserId, isOwner]);

  const memoCommunity = useMemo(() => community, [community]);

  const [stats, setStats] = useState<CommunityStatsDTO["data"] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveIsOwner) return;
    if (tab !== "visits") return;
    const communityId = community.id;
    if (!communityId) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setStatsLoading(true);
      setStatsErr(null);
      try {
        const base = API_BASE.replace(/\/+$/, "");
        const res = await fetch(
          `${base}/communaute/${encodeURIComponent(communityId)}/stats`,
          {
            headers: {
              Accept: "application/json",
              ...(loadSession()?.token
                ? { Authorization: `Bearer ${loadSession()!.token}` }
                : {}),
            },
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Erreur de chargement");
        }
        const json = (await res.json()) as CommunityStatsDTO;
        if (cancelled) return;
        if (!json.ok) {
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
      controller.abort();
    };
  }, [effectiveIsOwner, tab, community.id]);

  const ownerForStats: OwnerView = {
    fullName: "Propriétaire",
    firstName: "Propriétaire",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    coverUrl: "",
  };

  return (
    <div className="space-y-5 w-full">
      {/* onglets internes */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/30 border border-slate-100/80 dark:border-slate-700/40 px-2 py-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("about")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
              tab === "about"
                ? "bg-violet-600 text-white shadow-violet-500/25 shadow-sm"
                : "text-slate-700 dark:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
            }`}
          >
            <Info className="h-4 w-4" />À propos
          </button>

          {effectiveIsOwner ? (
            <button
              onClick={() => setTab("visits")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                tab === "visits"
                  ? "bg-violet-600 text-white shadow-violet-500/25 shadow-sm"
                  : "text-slate-700 dark:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <Footprints className="h-4 w-4" />
              Statistiques
            </button>
          ) : (
            <button
              onClick={() => setTab("owner")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                tab === "owner"
                  ? "bg-violet-600 text-white shadow-violet-500/25 shadow-sm"
                  : "text-slate-700 dark:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <UserCircle2 className="h-4 w-4" />
              Propriétaire
            </button>
          )}
        </div>
      </div>

      {/* contenu */}
      {tab === "about" && (
        <AboutTabWrapper
          community={memoCommunity}
          readOnly={!effectiveIsOwner}
          visitorStatus={visitorStatus}
          onVisitorJoin={onVisitorJoin}
          ctaBusy={ctaBusy}
          onVisitorLeave={onVisitorLeave}
          visitorLeaving={visitorLeaving}
        />
      )}

      {!effectiveIsOwner && tab === "owner" && (
        <OwnerTab
          ownerId={community.ownerId ?? ""}
          communityId={community.id ?? ""}
        />
      )}

      {effectiveIsOwner && tab === "visits" && (
        <OwnerAdminView
          owner={ownerForStats}
          stats={stats}
          statsLoading={statsLoading}
          statsErr={statsErr}
        />
      )}
    </div>
  );
}
