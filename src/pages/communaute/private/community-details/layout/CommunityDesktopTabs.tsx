// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\layout\CommunityDesktopTabs.tsx

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Home,
  Star,
  Settings,
  Banknote,
  ShoppingCart,
  UserPlus,
  Lock as LockIcon,
  Bell,
  GraduationCap,
  Users,
  Radio,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";

import TabItem from "../components/TabItem.js";
import { type TabKey } from "../types.js";
import { LOCKED_WHEN_NO_COMMUNITY } from "../../index/constants.js";

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
  /** Afficher ou non l’onglet "Mes achats" dans la sidebar */
  showPurchasesTab?: boolean;
  /** Callback pour informer le parent quand on plie / déplie */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Est-ce mon propre espace communauté ? */
  isSelfSpace?: boolean;
  /** Bouton "Fil d’actualité" (redirige vers /communaute?tab=feed) */
  onGoToFeed?: () => void;
  /** Indique si /communaute?tab=feed est l’onglet courant */
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
  notificationsUnseen = 0,
  canSeeNotifications = true,
  forceLockWhenNoCommunity = false,
  showPurchasesTab = true,
  onCollapseChange,
  isSelfSpace = false,
  onGoToFeed,
  isFeedActive = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // ✅ On notifie le parent *uniquement* via un effet
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const isLocked = (key: TabKey): boolean =>
    (isOwner || forceLockWhenNoCommunity) &&
    !hasCommunity &&
    LOCKED_WHEN_NO_COMMUNITY.includes(key);

  const totalRequests = (ownerPendingCount || 0) + (myPendingCount || 0);
  const showRequestsBadge = totalRequests > 0;
  const showReviewsBadge = isOwner && reviewUnseen > 0;
  const showNotifBadge = canSeeNotifications && notificationsUnseen > 0;

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
            "max-h[calc(100vh-6rem)]",
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
                Espace communauté
              </p>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={[
                "inline-flex items-center justify-center",
                "h-7 w-7 rounded-full",
                "border border-slate-200/70 dark:border-slate-700/70",
                "bg-white/80 dark:bg-slate-900/80",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "transition-colors",
              ].join(" ")}
              aria-label={collapsed ? "Déplier la sidebar" : "Plier la sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* NAV + scrollbar */}
          <nav
            className={[
              "flex-1",
              navPaddingX,
              "py-3",
              "space-y-1",
              "overflow-y-auto",
              // Firefox
              "[scrollbar-width:thin]",
              "[scrollbar-color:theme(colors.slate.400)_transparent]",
              "dark:[scrollbar-color:theme(colors.slate.700)_transparent]",
              // WebKit
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:bg-slate-400",
              "dark:[&::-webkit-scrollbar-thumb]:bg-slate-700",
            ].join(" ")}
          >
            {/* 🔹 1) Fil d’actualité tout en haut */}
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

            {/* 🔹 2) Détails / Ma communauté */}
            <TabItem
              icon={<LayoutGrid className="h-4 w-4" />}
              label={detailsLabel}
              active={active === "apercu"}
              onClick={() => onSelect("apercu")}
              fullWidth
              compact={collapsed}
            />

            <TabItem
              icon={
                isLocked("publications") ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <Home className="h-4 w-4" />
                )
              }
              label={publicationsLabel}
              active={active === "publications"}
              onClick={
                isLocked("publications")
                  ? undefined
                  : () => onSelect("publications")
              }
              fullWidth
              compact={collapsed}
            />

            <TabItem
              icon={
                isLocked("formations") ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )
              }
              label={formationsLabel}
              active={active === "formations"}
              onClick={
                isLocked("formations")
                  ? undefined
                  : () => onSelect("formations")
              }
              fullWidth
              compact={collapsed}
            />

            <TabItem
              icon={
                isLocked("groupes") ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )
              }
              label={groupesLabel}
              active={active === "groupes"}
              onClick={
                isLocked("groupes") ? undefined : () => onSelect("groupes")
              }
              fullWidth
              compact={collapsed}
            />

            <TabItem
              icon={
                isLocked("direct") ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <Radio className="h-4 w-4" />
                )
              }
              label={directLabel}
              active={active === "direct"}
              onClick={
                isLocked("direct") ? undefined : () => onSelect("direct")
              }
              fullWidth
              compact={collapsed}
            />

            <div className="relative">
              <TabItem
                icon={
                  isLocked("avis") ? (
                    <LockIcon className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )
                }
                label="Avis"
                active={active === "avis"}
                onClick={isLocked("avis") ? undefined : () => onSelect("avis")}
                fullWidth
                compact={collapsed}
              />
              {showReviewsBadge && !collapsed ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {reviewUnseen > 99 ? "99+" : reviewUnseen}
                </span>
              ) : null}
            </div>

            {canSeeNotifications && (
              <div className="relative">
                <TabItem
                  icon={<Bell className="h-4 w-4" />}
                  label="Notifications"
                  active={active === "notifications"}
                  onClick={() => onSelect("notifications")}
                  fullWidth
                  compact={collapsed}
                />
                {showNotifBadge && !collapsed ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {notificationsUnseen > 99 ? "99+" : notificationsUnseen}
                  </span>
                ) : null}
              </div>
            )}

            {isOwner && (
              <div className="my-2 h-px bg-slate-200/80 dark:bg-slate-800/80" />
            )}

            {isOwner && (
              <TabItem
                icon={
                  isLocked("ventes") ? (
                    <LockIcon className="h-4 w-4" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )
                }
                label="Mes ventes"
                active={active === "ventes"}
                onClick={
                  isLocked("ventes") ? undefined : () => onSelect("ventes")
                }
                fullWidth
                compact={collapsed}
              />
            )}

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

            {isOwner && (
              <>
                <div className="relative">
                  <TabItem
                    icon={<UserPlus className="h-4 w-4" />}
                    label="Mes abonnements"
                    active={active === "demandes"}
                    onClick={() => onSelect("demandes")}
                    fullWidth
                    compact={collapsed}
                  />
                  {showRequestsBadge && !collapsed ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {totalRequests > 99 ? "99+" : totalRequests}
                    </span>
                  ) : null}
                </div>

                <TabItem
                  icon={
                    isLocked("paramètres") ? (
                      <LockIcon className="h-4 w-4" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )
                  }
                  label="Paramètres"
                  active={active === "paramètres"}
                  onClick={
                    isLocked("paramètres")
                      ? undefined
                      : () => onSelect("paramètres")
                  }
                  fullWidth
                  compact={collapsed}
                />
              </>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
