// src/pages/communaute/private/community-details/layout/MobileDrawer.tsx

import type { ReactNode } from "react";
import {
  LayoutGrid,
  Home,
  Star,
  Settings,
  Banknote,
  ShoppingCart,
  UserPlus,
  GraduationCap,
  Users,
  Radio,
  X,
  Newspaper,
} from "lucide-react";

import { type TabKey } from "@features/community/types";
import { LOCKED_WHEN_NO_COMMUNITY } from "../constants";


type Props = {
  open: boolean;
  onClose: () => void;
  active: TabKey;
  onSelect: (k: TabKey) => void;
  isOwner: boolean;
  canAccessPrivates: boolean;
  hasCommunity: boolean;
  isSelfSpace: boolean;
  ownerPendingCount?: number;
  myPendingCount?: number;
  reviewUnseen?: number;

  /** Afficher ou non l’onglet “Mes achats” dans le menu mobile */
  showPurchasesTab?: boolean;
  /** Bouton "Fil d’actualité" */
  onGoToFeed?: () => void;
  /** Est-ce que /communaute?tab=feed est actif ? */
  isFeedActive?: boolean;
};

function DrawerItem({
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick?: () => void;
  badge?: number | string | null;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
          : "bg-slate-100/70 text-slate-800 dark:bg-slate-800/80 dark:text-slate-50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
      }`}
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
        <span>{label}</span>
      </span>
      {badge ? (
        <span className="ml-2 inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function MobileDrawer({
  open,
  onClose,
  active,
  onSelect,
  isOwner,
  canAccessPrivates,
  hasCommunity,
  isSelfSpace,
  ownerPendingCount = 0,
  myPendingCount = 0,
  reviewUnseen = 0,

  showPurchasesTab = true,
  onGoToFeed,
  isFeedActive = false,
}: Props) {
  if (!open) return null;

  /**
   * ✅ Détermine si l'onglet doit être masqué (si pas de communauté créée)
   */
  const isHidden = (key: TabKey): boolean =>
    isOwner && !hasCommunity && LOCKED_WHEN_NO_COMMUNITY.includes(key);

  const totalRequests = (ownerPendingCount || 0) + (myPendingCount || 0);
  const showRequestsBadge = totalRequests > 0;
  const showReviewsBadge = isOwner && reviewUnseen > 0;

  const canSeeSalesTabs = isOwner;
  const canSeePrivates = isOwner || canAccessPrivates;

  const publicationsLabel = isOwner ? "Mes publications" : "Publications";
  const formationsLabel = isOwner ? "Mes formations" : "Formations";
  const groupesLabel = isOwner ? "Mes groupes" : "Groupes";
  const directLabel = isOwner ? "Mes direct" : "Direct";
  const detailsLabel = isSelfSpace ? "Ma communauté" : "Détails";

  const handleClick = (key: TabKey) => {
    onSelect(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-slate-50 dark:bg-slate-900 shadow-xl border-l border-slate-200/80 dark:border-slate-700/80 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
            Menu Espace
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
          {/* 🔹 Fil d’actualité */}
          {onGoToFeed && (
            <DrawerItem
              icon={<Newspaper className="h-4 w-4" />}
              label="Fil d’actualité"
              active={isFeedActive}
              onClick={() => {
                onGoToFeed();
                onClose();
              }}
            />
          )}

          {/* 🔹 Détails / Ma communauté */}
          <DrawerItem
            icon={<LayoutGrid className="h-4 w-4" />}
            label={detailsLabel}
            active={active === "apercu"}
            onClick={() => handleClick("apercu")}
          />

          {/* 🔹 Publications */}
          {!isHidden("publications") && canSeePrivates && (
            <DrawerItem
              icon={<Home className="h-4 w-4" />}
              label={publicationsLabel}
              active={active === "publications"}
              onClick={() => handleClick("publications")}
            />
          )}

          {/* 🔹 Formations */}
          {!isHidden("formations") && canSeePrivates && (
            <DrawerItem
              icon={<GraduationCap className="h-4 w-4" />}
              label={formationsLabel}
              active={active === "formations"}
              onClick={() => handleClick("formations")}
            />
          )}

          {/* 🔹 Groupes */}
          {!isHidden("groupes") && canSeePrivates && (
            <DrawerItem
              icon={<Users className="h-4 w-4" />}
              label={groupesLabel}
              active={active === "groupes"}
              onClick={() => handleClick("groupes")}
            />
          )}

          {/* 🔹 Direct */}
          {!isHidden("direct") && canSeePrivates && (
            <DrawerItem
              icon={<Radio className="h-4 w-4" />}
              label={directLabel}
              active={active === "direct"}
              onClick={() => handleClick("direct")}
            />
          )}

          {/* 🔹 Avis */}
          {!isHidden("avis") && (
            <DrawerItem
              icon={<Star className="h-4 w-4" />}
              label="Avis"
              active={active === "avis"}
              badge={
                showReviewsBadge
                  ? reviewUnseen > 99
                    ? "99+"
                    : reviewUnseen
                  : null
              }
              onClick={() => handleClick("avis")}
            />
          )}

          {canSeeSalesTabs && (
            <div className="my-2 h-px bg-slate-200/80 dark:bg-slate-800/80" />
          )}

          {/* 🔹 Ventes */}
          {canSeeSalesTabs && !isHidden("ventes") && (
            <DrawerItem
              icon={<Banknote className="h-4 w-4" />}
              label="Mes ventes"
              active={active === "ventes"}
              onClick={() => handleClick("ventes")}
            />
          )}

          {/* 🔹 Achats */}
          {showPurchasesTab && (
            <DrawerItem
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Mes achats"
              active={active === "achats"}
              onClick={() => handleClick("achats")}
            />
          )}

          {/* 🔹 Abonnements / Demandes */}
          {isOwner && (
            <DrawerItem
              icon={<UserPlus className="h-4 w-4" />}
              label="Mes abonnements"
              active={active === "demandes"}
              badge={
                showRequestsBadge
                  ? totalRequests > 99
                    ? "99+"
                    : totalRequests
                  : null
              }
              onClick={() => handleClick("demandes")}
            />
          )}

          {/* 🔹 Paramètres */}
          {isOwner && !isHidden("paramètres") && (
            <DrawerItem
              icon={<Settings className="h-4 w-4" />}
              label="Paramètres"
              active={active === "paramètres"}
              onClick={() => handleClick("paramètres")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
