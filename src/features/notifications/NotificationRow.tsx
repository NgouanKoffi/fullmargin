// src/pages/notifications/NotificationRow.tsx
import { Clock, CheckCheck, ChevronRight } from "lucide-react";
import {
  CATEGORY_CONFIG,
  type Notification,
  type NotificationCategory,
} from "./constants";

type Props = {
  notif: Notification;
  isClickable: boolean;
  onClick: () => void;
  title: string;
  time: string;
  category: NotificationCategory;
  isLast: boolean;
};

export default function NotificationRow({
  notif,
  isClickable,
  onClick,
  title,
  time,
  category,
}: Props) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className={`relative flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-all ${
        isClickable
          ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
          : "cursor-default"
      } ${!notif.seen ? "bg-slate-50/80 dark:bg-slate-800/30" : ""}`}
    >
      {!notif.seen && (
        <div
          className={`absolute left-0 top-0 w-[3px] h-full rounded-r-full bg-gradient-to-b ${cfg.color}`}
        />
      )}

      <div
        className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mt-0.5 ${
          notif.seen
            ? `${cfg.bg} border ${cfg.border}`
            : `bg-gradient-to-br ${cfg.color} shadow-sm`
        }`}
      >
        <Icon
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
            notif.seen ? "text-slate-500 dark:text-slate-400" : "text-white"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug break-words ${
            notif.seen
              ? "text-slate-600 dark:text-slate-400 font-normal"
              : "text-slate-900 dark:text-slate-100 font-semibold"
          }`}
        >
          {title}
        </p>

        {!!notif.payload?.message && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-1">
            {String(notif.payload.message)}
          </p>
        )}

        {!!notif.payload?.amount && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            + {String(notif.payload.amount)}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {time}
          </span>
          {notif.seen && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              · <CheckCheck className="w-3 h-3 inline" /> Lu
            </span>
          )}
        </div>
      </div>

      {isClickable && (
        <ChevronRight className="flex-shrink-0 w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5 self-center" />
      )}
    </div>
  );
}
