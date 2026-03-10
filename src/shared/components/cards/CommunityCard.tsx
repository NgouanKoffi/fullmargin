// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\cards\CommunityCard.tsx
import {
  Lock,
  LockOpen,
  Star,
  Users as UsersIcon,
  Plus,
  Crown,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export type CommunityType = "free" | "private";

/** Rôle de l'utilisateur vis-à-vis de la communauté (pour contrôler l'affichage du CTA) */
type UserRole = "owner" | "member" | "none";

export type CommunityCardData = {
  id: string | number;
  name: string;
  coverSrc: string;
  logoSrc?: string;
  rating: number;
  followers: number;
  owner: { name: string; avatar: string };
  tags?: string[];
  type: CommunityType; // "free" | "private"
  href?: string;
  description?: string;
  /** rôle calculé par le parent */
  role?: UserRole;
  /** 🔹 Date de création (pour les filtres admin) */
  createdAt?: string | null;
};

export type CommunityCardProps = {
  data: CommunityCardData;
  className?: string;
  onPrimaryClick?: (c: CommunityCardData) => void | Promise<void>;
  /** Optionnel : surcharger le libellé du CTA */
  ctaLabelOverride?: string;
  ctaDisabled?: boolean;
};

function kfmt(n: number) {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "k";
  return String(n);
}

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#7c3aed'/><stop offset='100%' stop-color='#06b6d4'/>
      </linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
    </svg>`
  );

export default function CommunityCard({
  data,
  className = "",
  onPrimaryClick,
  ctaLabelOverride,
  ctaDisabled = false,
}: CommunityCardProps) {
  const [busy, setBusy] = useState(false);

  // rôle qui vient du parent
  const [roleFromParent, setRoleFromParent] = useState<UserRole>(
    data.role ?? "none"
  );
  // rôle forcé après un event "je me suis désabonné"
  const [forcedRole, setForcedRole] = useState<UserRole | null>(null);

  // si le parent change MAIS qu'on n'a pas forcé,
  // on suit le parent
  useEffect(() => {
    if (forcedRole === null) {
      setRoleFromParent(data.role ?? "none");
    }
  }, [data.role, forcedRole]);

  // écoute de l'événement global envoyé après un leave
  useEffect(() => {
    function onMembershipChanged(e: Event) {
      const ev = e as CustomEvent<{ communityId?: string | number }>;
      const cid = ev.detail?.communityId;
      if (!cid) return;
      if (String(cid) === String(data.id)) {
        // à partir de maintenant, même si le parent renvoie "member",
        // on reste en "none"
        setForcedRole("none");
      }
    }
    window.addEventListener(
      "fm:community:membership-changed",
      onMembershipChanged
    );
    return () => {
      window.removeEventListener(
        "fm:community:membership-changed",
        onMembershipChanged
      );
    };
  }, [data.id]);

  const effectiveRole: UserRole =
    forcedRole !== null ? forcedRole : roleFromParent;

  const logo = data.logoSrc || data.coverSrc;
  const defaultLabel = data.type === "free" ? "Rejoindre" : "Demander l’accès";
  const ctaLabel = ctaLabelOverride || defaultLabel;

  const CardInner = (
    <article
      className={`group overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10
                  bg-white/70 dark:bg-white/[0.06] transition-colors
                  hover:bg-white/80 dark:hover:bg-white/[0.09]`}
    >
      {/* COVER */}
      <div className="relative w-full aspect-[16/9]">
        <img
          src={data.coverSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== FALLBACK) img.src = FALLBACK;
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -inset-x-10 -inset-y-10 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* badge type */}
        <div className="absolute top-3 left-3">
          {data.type === "private" ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-black/60 text-white backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5" /> Privée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-emerald-600/90 text-white">
              Libre
            </span>
          )}
        </div>

        {/* note */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-[2px]
                       bg-black/70 text-white text-[11px] font-semibold backdrop-blur"
            title={`Note ${data.rating.toFixed(1)}`}
          >
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            {data.rating.toFixed(1)}
          </span>
        </div>

        {/* logo */}
        <div className="absolute -bottom-8 left-5">
          <div className="relative">
            <img
              src={logo}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== FALLBACK) img.src = FALLBACK;
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-white dark:ring-[#0f1115] shadow-md"
            />
            <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-violet-500/0 group-hover:ring-violet-500/30 transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
              {data.name}
            </h3>
            {!!data.tags?.length && (
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                {data.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* followers */}
          <span
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                       bg-black/60 text-white text-[11px] backdrop-blur-sm"
            title={`${data.followers.toLocaleString()} abonnés`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            {kfmt(data.followers)}
          </span>
        </div>

        {/* description */}
        {data.description && (
          <p className="mt-2 text-[12px] text-slate-700 dark:text-slate-300 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Owner + CTA */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={data.owner.avatar}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== FALLBACK) img.src = FALLBACK;
              }}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
            <div className="text-[12px] text-slate-700 dark:text-slate-300 truncate">
              {data.owner.name}
            </div>
          </div>

          <div className="grow" />

          {/* Rendu selon rôle (on utilise le rôle EFFECTIF) */}
          {effectiveRole === "owner" ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px]
                         ring-1 ring-violet-500/40 text-violet-700 dark:text-violet-300
                         bg-violet-50 dark:bg-violet-500/10 w-full sm:w-auto"
            >
              <Crown className="w-3.5 h-3.5" />
              Vous êtes l’administrateur
            </div>
          ) : effectiveRole === "member" ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px]
                         ring-1 ring-emerald-500/40 text-emerald-700 dark:text-emerald-300
                         bg-emerald-50 dark:bg-emerald-500/10 w-full sm:w-auto"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              Membre
            </div>
          ) : (
            <button
              type="button"
              disabled={ctaDisabled || busy}
              onClick={async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (ctaDisabled || busy) return;
                if (onPrimaryClick) {
                  try {
                    setBusy(true);
                    const res = onPrimaryClick(data);
                    if (
                      res &&
                      typeof (res as Promise<void>).then === "function"
                    ) {
                      await res;
                    }
                  } finally {
                    setBusy(false);
                  }
                }
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px]
                         shadow-sm transition w-full sm:w-auto
                         ${
                           ctaDisabled || busy
                             ? "bg-black/10 dark:bg-white/10 text-slate-400 cursor-not-allowed"
                             : "bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98]"
                         }`}
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Traitement…
                </>
              ) : data.type === "free" ? (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  {ctaLabel}
                </>
              ) : (
                <>
                  <LockOpen className="w-3.5 h-3.5" />
                  {ctaLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );

  return data.href ? (
    <Link
      to={data.href}
      className={`block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${className}`}
    >
      {CardInner}
    </Link>
  ) : (
    <div className={className}>{CardInner}</div>
  );
}

export const CommunityCardFree = (p: CommunityCardProps) => (
  <CommunityCard {...p} />
);
export const CommunityCardPrivate = (p: CommunityCardProps) => (
  <CommunityCard {...p} />
);
