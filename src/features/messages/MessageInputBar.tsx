// src/components/messages/MessageInputBar.tsx
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Send,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  X,
  Plus,
  SmilePlus,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export type AttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
  onPickFiles?: (files: File[]) => void;
  attachments?: AttachmentMeta[];
  onRemoveAttachment?: (id: string) => void;
  /** max height du champ avant que ça ne scrolle à l'intérieur (px) */
  maxHeight?: number;
  /** message d’erreur pour les pièces jointes (taille / format) */
  error?: string;
};

const DEFAULT_MAX_HEIGHT = 120; // ≈ 4–5 lignes

function formatSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} Ko`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
}

type EmojiNative = {
  native?: string;
};

export default function MessageInputBar({
  value,
  onChange,
  onSend,
  sending,
  placeholder,
  onPickFiles,
  attachments = [],
  onRemoveAttachment,
  maxHeight = DEFAULT_MAX_HEIGHT,
  error,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // menu + & picker emoji
  const [moreOpen, setMoreOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  // auto-resize du textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(maxHeight, el.scrollHeight);
    el.style.height = `${next}px`;
  }, [value, maxHeight]);

  // fermer le menu + si clic en dehors
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // fermer le picker emoji avec ESC
  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEmojiOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [emojiOpen]);

  // fermer le picker emoji si clic en dehors
  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: MouseEvent) => {
      if (!emojiRef.current) return;
      if (!emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiOpen]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange(e.target.value);
  };

  const handleSendClick = () => {
    onSend();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    onPickFiles?.(files);
    // reset pour pouvoir re-sélectionner le même fichier
    e.target.value = "";
  };

  const canSend =
    (value.trim().length > 0 || attachments.length > 0) && !sending;

  // Insertion de l’emoji à la position du curseur
  const handleSelectEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const current = value || "";

    if (!el) {
      onChange(current + emoji);
      return;
    }

    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;

    const next =
      current.slice(0, start) + emoji + current.slice(end, current.length);

    onChange(next);

    // On remet le focus + le curseur juste après l’emoji
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.selectionStart = pos;
      el.selectionEnd = pos;
    });
  };

  return (
    <>
      <div className="border-t border-black/[0.03] dark:border-white/[0.03] px-3 sm:px-4 pt-3 pb-3.5 bg-white/98 dark:bg-[#0f1115]/98 backdrop-blur-xl">
        {/* Prévisualisation des pièces jointes */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 flex flex-wrap gap-2 overflow-hidden"
            >
              {attachments.map((att) => {
                const isImage = att.type.startsWith("image/");
                const isVideo = att.type.startsWith("video/");

                return (
                  <motion.div
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    key={att.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200/50 dark:hover:bg-white/[0.06]"
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {isImage ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      ) : isVideo ? (
                        <VideoIcon className="w-3.5 h-3.5 text-purple-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                      )}
                      <span className="max-w-[140px] truncate">{att.name}</span>
                    </span>
                    <span className="opacity-50 text-[10px] font-mono">
                      {formatSize(att.size)}
                    </span>
                    {onRemoveAttachment && (
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(att.id)}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"
                        aria-label="Retirer la pièce jointe"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-[11px] font-semibold text-red-500 dark:text-red-400 px-1"
          >
            {error}
          </motion.p>
        )}

        {/* Barre principale */}
        <div className="flex items-end gap-2.5">
          {/* Bouton PLUS (menu fichiers + emojis) */}
          <div className="relative shrink-0 mb-0.5" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 transform active:scale-95 ${
                moreOpen 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20 rotate-45" 
                : "bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] shadow-sm"
              }`}
              title="Plus d’options"
            >
              <Plus className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9, originX: 0, originY: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute bottom-12 left-0 z-50 w-44 rounded-2xl bg-white dark:bg-[#151821] shadow-2xl border border-black/[0.08] dark:border-white/[0.08] py-1.5 overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      handleAttachClick();
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <span>Fichier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setEmojiOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <SmilePlus className="w-4 h-4" />
                    </div>
                    <span>Emoji</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Champ texte */}
          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none no-scrollbar text-[14px] leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 dark:focus:border-violet-400/50 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px]"
            />
          </div>

          <button
            type="button"
            onClick={handleSendClick}
            disabled={!canSend}
            className={`
              inline-flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 transition-all duration-300 transform mb-0.5
              ${canSend 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 hover:-translate-y-0.5 active:scale-95" 
                : "bg-slate-100 dark:bg-white/[0.05] text-slate-400 cursor-not-allowed opacity-60"
              }
            `}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className={`w-5 h-5 ${canSend && "translate-x-0.5 -translate-y-0.5 rotate-[-10deg]"}`} />
            )}
          </button>
        </div>

        {/* input fichier caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </div>

      {/* Panel EMOJI flottant (style Premium) */}
      <AnimatePresence>
        {emojiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={emojiRef}
            className="
              fixed
              inset-x-0
              bottom-24
              z-[200]
              flex
              justify-center
              px-2 sm:px-4
            "
          >
            <div className="w-[min(420px,100%)]">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEmojiOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-[#111318]/80 backdrop-blur-md shadow-xl border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#111318] transition-all"
                  aria-label="Fermer les emojis"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-[2rem] shadow-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xl overflow-hidden max-h-[50vh] ring-1 ring-black/5 dark:ring-white/5">
                <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: EmojiNative) => {
                      const native = emoji?.native || "";
                      if (native) {
                        handleSelectEmoji(native);
                      }
                    }}
                    theme="light"
                    navPosition="top"
                    previewPosition="none"
                    searchPosition="top"
                    className="!w-full !border-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
