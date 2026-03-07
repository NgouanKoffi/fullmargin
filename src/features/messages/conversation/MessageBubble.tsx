import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { ChatMessage } from "./messages.types";
import MessageAttachments from "./MessageAttachments";

interface MessageBubbleProps {
  m: ChatMessage;
  isMine: boolean;
  isAdminAuthor: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

function linkifyText(text: string): React.ReactNode[] {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-violet-400 hover:decoration-violet-600 break-all"
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export const MessageBubble = React.memo(
  ({ m, isMine, isAdminAuthor, canDelete, onDelete }: MessageBubbleProps) => {
    const content = useMemo(() => linkifyText(m.body), [m.body]);
    const bubbleClass = isMine
      ? "bg-violet-600 text-white rounded-br-md rounded-tr-2xl"
      : "bg-slate-100 dark:bg-[#181b24] text-slate-900 dark:text-slate-100 rounded-bl-md rounded-tl-2xl";

    return (
      <div
        className={`flex w-full ${isMine ? "justify-end" : "justify-start"} gap-3`}
      >
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden shrink-0 grid place-items-center text-[11px]">
            {m.authorAvatar ? (
              <img
                src={m.authorAvatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (m.authorName || "?").slice(0, 2).toUpperCase()
            )}
          </div>
        )}
        <div
          className={`flex flex-col gap-1 max-w-[78%] sm:max-w-[65%] ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          {!isMine && (
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {m.authorName || "Membre"}
              </span>
              {isAdminAuthor && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-600/15 text-violet-500 border border-violet-500/40">
                  Admin
                </span>
              )}
            </div>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm relative ${bubbleClass}`}
          >
            {m.body && (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            )}
            <MessageAttachments attachments={m.attachments} />
            {canDelete && (
              <button
                onClick={() => onDelete(m.id)}
                className="absolute -top-2 right-2 rounded-full bg-black/20 hover:bg-black/30 w-6 h-6 text-[10px] grid place-items-center"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    );
  }
);
