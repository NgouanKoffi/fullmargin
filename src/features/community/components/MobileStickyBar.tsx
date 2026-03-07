// src/pages/communaute/private/community-details/components/MobileStickyBar.tsx
import { Menu } from "lucide-react";

export default function MobileStickyBar({
  title,
  onOpenMenu,
  topClass = "top-16",
  // 👇 compteurs
  ownerPendingCount = 0,
  myPendingCount = 0,
  reviewUnseen = 0,
  notificationsUnseen = 0, // 👈 ajouté
}: {
  title: string;
  onOpenMenu: () => void;
  /** adapte si ton header est plus haut (ex: "top-20") */
  topClass?: string;
  /** demandes reçues pour ma communauté (je suis owner) */
  ownerPendingCount?: number;
  /** demandes qui me concernent moi (ma demande approuvée / refusée) */
  myPendingCount?: number;
  /** avis non lus (nouveaux reviews sur ma communauté) */
  reviewUnseen?: number;
  /** notifications internes non vues */
  notificationsUnseen?: number;
}) {
  // total à afficher dans le badge
  const total =
    (ownerPendingCount || 0) +
    (myPendingCount || 0) +
    (reviewUnseen || 0) +
    (notificationsUnseen || 0);
  const hasNotif = total > 0;

  return (
    <div
      className={`lg:hidden sticky z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 ${topClass}`}
    >
      <div className="h-12 rounded-xl bg-white/85 dark:bg-slate-900/80 backdrop-blur shadow-sm ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-between px-3">
        <div className="font-medium">{title}</div>
        <button
          onClick={onOpenMenu}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:opacity-90"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />

          {hasNotif ? (
            <span
              className="absolute -top-1 -right-1 min-w-[1.3rem] h-5 px-1.5 rounded-full bg-red-500 text-[10px] leading-none flex items-center justify-center font-semibold shadow-lg"
              aria-label={`${total} notification(s)`}
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
