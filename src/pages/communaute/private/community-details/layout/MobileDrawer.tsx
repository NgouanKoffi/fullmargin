// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\layout\MobileDrawer.tsx

import type { ReactNode } from "react";
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
  X,
  Newspaper,
} from "lucide-react";

import { type TabKey } from "../types";
import { LOCKED_WHEN_NO_COMMUNITY } from "../../index/constants.js";

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
  notificationsUnseen?: number;
  canSeeNotifications?: boolean;
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
  locked,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick?: () => void;
  badge?: number | string | null;
  locked?: boolean;
}) {
  const isDisabled = locked || !onClick;

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
        active
          ? "bg-violet-600 text-white"
          : "bg-slate-100/70 text-slate-800 dark:bg-slate-800/80 dark:text-slate-50"
      } ${
        isDisabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-violet-50 dark:hover:bg-slate-700"
      }`}
      onClick={isDisabled ? undefined : onClick}
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
  notificationsUnseen = 0,
  canSeeNotifications = true,
  showPurchasesTab = true,
  onGoToFeed,
  isFeedActive = false,
}: Props) {
  if (!open) return null;

  const isLocked = (key: TabKey): boolean =>
    isOwner && !hasCommunity && LOCKED_WHEN_NO_COMMUNITY.includes(key);

  const totalRequests = (ownerPendingCount || 0) + (myPendingCount || 0);
  const showRequestsBadge = totalRequests > 0;
  const showReviewsBadge = isOwner && reviewUnseen > 0;
  const showNotifBadge = canSeeNotifications && notificationsUnseen > 0;

  const canSeeSalesTabs = isOwner; // Ventes uniquement owner
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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-slate-50 dark:bg-slate-900 shadow-xl border-l border-slate-200/80 dark:border-slate-700/80 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Espace communauté
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* 🔹 1) Fil d’actualité tout en haut */}
          {onGoToFeed && (
            <DrawerItem
              icon={<Newspaper className="h-4 w-4" />}
              label="Fil d’actualité"
              active={isFeedActive}
              onClick={() => {
                onGoToFeed();
              }}
            />
          )}

          {/* 🔹 2) Détails / Ma communauté */}
          <DrawerItem
            icon={<LayoutGrid className="h-4 w-4" />}
            label={detailsLabel}
            active={active === "apercu"}
            onClick={() => handleClick("apercu")}
          />

          <DrawerItem
            icon={
              isLocked("publications") || !canSeePrivates ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <Home className="h-4 w-4" />
              )
            }
            label={publicationsLabel}
            active={active === "publications"}
            locked={isLocked("publications") || !canSeePrivates}
            onClick={
              isLocked("publications") || !canSeePrivates
                ? undefined
                : () => handleClick("publications")
            }
          />

          <DrawerItem
            icon={
              isLocked("formations") || !canSeePrivates ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )
            }
            label={formationsLabel}
            active={active === "formations"}
            locked={isLocked("formations") || !canSeePrivates}
            onClick={
              isLocked("formations") || !canSeePrivates
                ? undefined
                : () => handleClick("formations")
            }
          />

          <DrawerItem
            icon={
              isLocked("groupes") || !canSeePrivates ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )
            }
            label={groupesLabel}
            active={active === "groupes"}
            locked={isLocked("groupes") || !canSeePrivates}
            onClick={
              isLocked("groupes") || !canSeePrivates
                ? undefined
                : () => handleClick("groupes")
            }
          />

          <DrawerItem
            icon={
              isLocked("direct") || !canSeePrivates ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <Radio className="h-4 w-4" />
              )
            }
            label={directLabel}
            active={active === "direct"}
            locked={isLocked("direct") || !canSeePrivates}
            onClick={
              isLocked("direct") || !canSeePrivates
                ? undefined
                : () => handleClick("direct")
            }
          />

          {/* Avis */}
          <DrawerItem
            icon={
              isLocked("avis") ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <Star className="h-4 w-4" />
              )
            }
            label="Avis"
            active={active === "avis"}
            locked={isLocked("avis")}
            badge={
              showReviewsBadge
                ? reviewUnseen > 99
                  ? "99+"
                  : reviewUnseen
                : null
            }
            onClick={isLocked("avis") ? undefined : () => handleClick("avis")}
          />

          {/* Notifications */}
          {canSeeNotifications && (
            <DrawerItem
              icon={<Bell className="h-4 w-4" />}
              label="Notifications"
              active={active === "notifications"}
              badge={
                showNotifBadge
                  ? notificationsUnseen > 99
                    ? "99+"
                    : notificationsUnseen
                  : null
              }
              onClick={() => handleClick("notifications")}
            />
          )}

          {/* Mes ventes : owner uniquement */}
          {canSeeSalesTabs && (
            <DrawerItem
              icon={
                isLocked("ventes") ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <Banknote className="h-4 w-4" />
                )
              }
              label="Mes ventes"
              active={active === "ventes"}
              locked={isLocked("ventes")}
              onClick={
                isLocked("ventes") ? undefined : () => handleClick("ventes")
              }
            />
          )}

          {/* Mes achats */}
          {showPurchasesTab && (
            <DrawerItem
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Mes achats"
              active={active === "achats"}
              onClick={() => handleClick("achats")}
            />
          )}

          {/* Mes abonnements + Paramètres (owner) */}
          {isOwner && (
            <>
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
              <DrawerItem
                icon={
                  isLocked("paramètres") ? (
                    <LockIcon className="h-4 w-4" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )
                }
                label="Paramètres"
                active={active === "paramètres"}
                locked={isLocked("paramètres")}
                onClick={
                  isLocked("paramètres")
                    ? undefined
                    : () => handleClick("paramètres")
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
