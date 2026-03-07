// src/pages/communaute/private/community-details/layout/CommunityDesktopTabs.tsx

import { useEffect, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";

import TabItem from "@shared/components/TabItem";
import { type TabKey } from "@features/community/types";
import { LOCKED_WHEN_NO_COMMUNITY } from "../constants";


type Props = {
  active?: TabKey | null;
  onSelect: (k: TabKey) => void;
  isOwner: boolean;
  hasCommunity: boolean;
  ownerPendingCount?: number;
  myPendingCount?: number;
  reviewUnseen?: number;
  notificationsUnseen?: number;
  canSeeNotifications?: boolean;
  forceLockWhenNoCommunity?: boolean;
  showPurchasesTab?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  isSelfSpace?: boolean;
  onGoToFeed?: () => void;
  isFeedActive?: boolean;
};

export default function CommunityDesktopTabs({
  active,
  onSelect,
  isOwner,
  hasCommunity,
  ownerPendingCount = 0,
  myPendingCount = 0,
  reviewUnseen = 0,
  forceLockWhenNoCommunity = false,
  showPurchasesTab = true,
  onCollapseChange,
  isSelfSpace = false,
  onGoToFeed,
  isFeedActive = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  /**
   * ✅ Détermine si un onglet doit être MASQUÉ
   */
  const isHidden = (key: TabKey): boolean =>
    (isOwner || forceLockWhenNoCommunity) &&
    !hasCommunity &&
    LOCKED_WHEN_NO_COMMUNITY.includes(key);

  const totalRequests = (ownerPendingCount || 0) + (myPendingCount || 0);
  const showRequestsBadge = totalRequests > 0;
  const showReviewsBadge = isOwner && reviewUnseen > 0;

  const publicationsLabel = isOwner ? "Mes publications" : "Publications";
  const formationsLabel = isOwner ? "Mes formations" : "Formations";
  const groupesLabel = isOwner ? "Mes groupes" : "Groupes";
  const directLabel = isOwner ? "Mes direct" : "Direct";
  const detailsLabel = isSelfSpace ? "Ma communauté" : "Détails";

  const containerWidth = collapsed ? "w-16" : "w-64";
  const navPaddingX = collapsed ? "px-1" : "px-2";

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 z-30">
        <div
          className={[
            containerWidth,
            "max-h-[calc(100vh-6rem)]",
            "rounded-3xl",
            "bg-white/90 dark:bg-slate-950/90",
            "backdrop-blur",
            "shadow-sm",
            "ring-1 ring-black/5 dark:ring-white/10",
            "flex flex-col",
            "overflow-hidden",
            "transition-all duration-200",
          ].join(" ")}
        >
          {/* Header + bouton de pliage */}
          <div
            className={[
              "border-b border-slate-200/80 dark:border-slate-800/80",
              "flex items-center",
              collapsed
                ? "justify-center px-2 pt-3 pb-3"
                : "justify-between px-4 pt-4 pb-3",
            ].join(" ")}
          >
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Espace
              </p>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav
            className={[
              "flex-1",
              navPaddingX,
              "py-3",
              "space-y-1",
              "overflow-y-auto scrollbar-hide",
            ].join(" ")}
          >
            {/* 🔹 Fil d’actualité */}
            {onGoToFeed && (
              <TabItem
                icon={<Newspaper className="h-4 w-4" />}
                label="Fil d’actualité"
                active={isFeedActive}
                onClick={onGoToFeed}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Détails / Ma communauté */}
            <TabItem
              icon={<LayoutGrid className="h-4 w-4" />}
              label={detailsLabel}
              active={active === "apercu"}
              onClick={() => onSelect("apercu")}
              fullWidth
              compact={collapsed}
            />

            {/* 🔹 Publications */}
            {!isHidden("publications") && (
              <TabItem
                icon={<Home className="h-4 w-4" />}
                label={publicationsLabel}
                active={active === "publications"}
                onClick={() => onSelect("publications")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Formations */}
            {!isHidden("formations") && (
              <TabItem
                icon={<GraduationCap className="h-4 w-4" />}
                label={formationsLabel}
                active={active === "formations"}
                onClick={() => onSelect("formations")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Groupes */}
            {!isHidden("groupes") && (
              <TabItem
                icon={<Users className="h-4 w-4" />}
                label={groupesLabel}
                active={active === "groupes"}
                onClick={() => onSelect("groupes")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Direct */}
            {!isHidden("direct") && (
              <TabItem
                icon={<Radio className="h-4 w-4" />}
                label={directLabel}
                active={active === "direct"}
                onClick={() => onSelect("direct")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Avis */}
            {!isHidden("avis") && (
              <div className="relative">
                <TabItem
                  icon={<Star className="h-4 w-4" />}
                  label="Avis"
                  active={active === "avis"}
                  onClick={() => onSelect("avis")}
                  fullWidth
                  compact={collapsed}
                />
                {showReviewsBadge && !collapsed && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {reviewUnseen > 99 ? "99+" : reviewUnseen}
                  </span>
                )}
              </div>
            )}

            {isOwner && (
              <div className="my-2 h-px bg-slate-200/80 dark:bg-slate-800/80" />
            )}

            {/* 🔹 Ventes */}
            {isOwner && !isHidden("ventes") && (
              <TabItem
                icon={<Banknote className="h-4 w-4" />}
                label="Mes ventes"
                active={active === "ventes"}
                onClick={() => onSelect("ventes")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Achats */}
            {showPurchasesTab && (
              <TabItem
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Mes achats"
                active={active === "achats"}
                onClick={() => onSelect("achats")}
                fullWidth
                compact={collapsed}
              />
            )}

            {/* 🔹 Abonnements / Demandes (Correction : Ajout du check isHidden pour éviter les sauts) */}
            {isOwner && !isHidden("demandes") && (
              <div className="relative">
                <TabItem
                  icon={<UserPlus className="h-4 w-4" />}
                  label="Mes abonnements"
                  active={active === "demandes"}
                  onClick={() => onSelect("demandes")}
                  fullWidth
                  compact={collapsed}
                />
                {showRequestsBadge && !collapsed && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {totalRequests > 99 ? "99+" : totalRequests}
                  </span>
                )}
              </div>
            )}

            {/* 🔹 Paramètres */}
            {isOwner && !isHidden("paramètres") && (
              <TabItem
                icon={<Settings className="h-4 w-4" />}
                label="Paramètres"
                active={active === "paramètres"}
                onClick={() => onSelect("paramètres")}
                fullWidth
                compact={collapsed}
              />
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
