import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    const [isConfirming, setIsConfirming] = React.useState(false);
    const content = useMemo(() => linkifyText(m.body), [m.body]);
    
    const bubbleClass = isMine
      ? "bg-violet-600 text-white rounded-br-sm rounded-tr-2xl rounded-l-2xl"
      : "bg-slate-100 dark:bg-[#1b1e26] text-slate-900 dark:text-slate-100 rounded-bl-sm rounded-tl-2xl rounded-r-2xl";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`flex w-full ${isMine ? "flex-row-reverse" : "flex-row"} items-end gap-2 group mb-1`}
      >
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-violet-500/10 dark:bg-violet-400/10 border border-violet-500/20 dark:border-violet-400/20 overflow-hidden shrink-0 grid place-items-center text-[11px] font-bold text-violet-600 dark:text-violet-400 mb-5">
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
          className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          {!isMine && (
            <div className="flex items-center gap-1.5 ml-1 mb-0.5 font-sans">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {m.authorName || "Membre"}
              </span>
              {isAdminAuthor && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-600/10 text-violet-500 border border-violet-500/20 uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          )}

          <div className="relative group/bubble">
            <div
              className={`px-4 py-2.5 text-[13.5px] sm:text-[14.5px] leading-relaxed shadow-sm transition-all duration-300 font-sans ${bubbleClass}`}
            >
              {m.body && (
                <p className="whitespace-pre-wrap break-words">{content}</p>
              )}
              <MessageAttachments attachments={m.attachments} />
              
              <div className="flex items-center justify-between gap-4 mt-1 opacity-60">
                <span className="text-[10px] select-none font-medium">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Delete Confirmation Overlay / Button */}
            {canDelete && (
              <div className={`absolute top-0 ${isMine ? "-left-11" : "-right-11"} h-full flex items-center transition-opacity duration-200 ${isConfirming ? "opacity-100" : "opacity-0 group-hover/bubble:opacity-100"}`}>
                <AnimatePresence mode="wait">
                  {isConfirming ? (
                    <motion.div 
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.8, x: isMine ? 10 : -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 bg-white dark:bg-[#111318] shadow-2xl border border-red-500/30 rounded-xl px-2 py-1.5 z-50"
                    >
                      <button
                        onClick={() => {
                          onDelete(m.id);
                          setIsConfirming(false);
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 px-1.5 py-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        Supprimer
                      </button>
                      <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
                      <button
                        onClick={() => setIsConfirming(false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Non
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      key="trash"
                      onClick={() => setIsConfirming(true)}
                      className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                      title="Supprimer le message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
