// src/pages/notifications/CategorySection.tsx
import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import {
  CATEGORY_CONFIG,
  NON_CLICKABLE_TYPES,
  type Notification,
  type NotificationCategory,
} from "./constants";
import NotificationRow from "./NotificationRow";

type Props = {
  category: NotificationCategory;
  items: Notification[];
  onNotifClick: (n: Notification) => void;
  getTitle: (n: Notification) => string;
  formatDate: (s?: string) => string;
  showHeader: boolean;
  onSeeAll?: () => void;
  defaultExpanded?: boolean; // Permet de gérer le pliage par défaut !
};

export default function CategorySection({
  category,
  items,
  onNotifClick,
  getTitle,
  formatDate,
  showHeader,
  onSeeAll,
  defaultExpanded = false, // Par défaut, on plie !
}: Props) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;

  // État local pour le déploiement
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <section>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-sm`}
            >
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {cfg.label}
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
            >
              {items.length}
            </span>
            <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-1 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {onSeeAll && items.length > 3 && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {(isExpanded || !showHeader) && (
        <div
          className={`rounded-2xl border overflow-hidden ${cfg.border} bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.color}`} />

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((notif, idx) => {
              const isClickable = !NON_CLICKABLE_TYPES.includes(notif.kind);
              return (
                <NotificationRow
                  key={notif.id}
                  notif={notif}
                  isClickable={isClickable}
                  onClick={() => onNotifClick(notif)}
                  title={getTitle(notif)}
                  time={formatDate(notif.createdAt)}
                  category={category}
                  isLast={idx === items.length - 1}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
