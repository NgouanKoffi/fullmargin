// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Demandes\DemandesTabsBar.tsx
import React from "react";
import { SendHorizontal, Inbox, Users } from "lucide-react";

export type DemandesSubTab = "mine" | "incoming" | "communities";

export default function DemandesTabsBar({
  active,
  onSelect,
  mineCount = 0,
  incomingCount = 0,
  communitiesCount = 0,
}: {
  active: DemandesSubTab;
  onSelect: (t: DemandesSubTab) => void;
  mineCount?: number;
  incomingCount?: number;
  communitiesCount?: number;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
      <TabButton
        active={active === "mine"}
        onClick={() => onSelect("mine")}
        icon={<SendHorizontal className="w-4 h-4" />}
        label="Mes demandes"
        badge={mineCount}
      />
      <TabButton
        active={active === "incoming"}
        onClick={() => onSelect("incoming")}
        icon={<Inbox className="w-4 h-4" />}
        label="Demandes reçues"
        badge={incomingCount}
      />
      <TabButton
        active={active === "communities"}
        onClick={() => onSelect("communities")}
        icon={<Users className="w-4 h-4" />}
        label="Mes abonnements"
        badge={communitiesCount}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  const showBadge = typeof badge === "number" && badge > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-sm font-semibold transition
      ${
        active
          ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
          : "bg-slate-100/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-900/60"
      }`}
    >
      {icon}
      {label}
      {showBadge ? (
        <span className="inline-flex items-center justify-center min-w-[1.3rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}
