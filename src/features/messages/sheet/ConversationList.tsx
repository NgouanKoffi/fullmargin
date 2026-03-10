import clsx from "clsx";
import { FriendlyIssue } from "./FriendlyIssue";
import type { Conversation } from "../useConversations";

type Props = {
  items: Conversation[];
  locallyReadIds: string[];
  onSelect: (c: Conversation) => void;
};

export function ConversationList({ items, locallyReadIds, onSelect }: Props) {
  if (items.length === 0) {
    return <FriendlyIssue />;
  }

  return (
    <ul className="space-y-1.5 mt-3">
      {items.map((c) => {
        const isLocallyRead = locallyReadIds.includes(c.id);
        const unreadToShow = isLocallyRead ? 0 : c.unread ?? 0;

        const avatarUrl =
          c.variant === "group"
            ? (c as any).avatar ||
              (c as any).avatarUrl ||
              (c as any).coverUrl ||
              c.avatar
            : c.avatar;

        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className={clsx(
                "w-full text-left rounded-xl px-3.5 py-3",
                "bg-white/75 dark:bg-[#0f1115]/75",
                "ring-1 ring-black/10 dark:ring-white/10",
                "hover:bg-white/95 dark:hover:bg-[#12141a]",
                "transition-colors"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden shrink-0 grid place-items-center text-xs text-skin-muted">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    (c.name || "?").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="ml-auto text-[11px] opacity-70">
                      {c.time || ""}
                    </span>
                  </div>
                  <div className="text-[13px] opacity-80 line-clamp-1">
                    {c.lastMsg || ""}
                  </div>
                </div>
                {unreadToShow > 0 ? (
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold bg-violet-600 text-white">
                    {unreadToShow}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
