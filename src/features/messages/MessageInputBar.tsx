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
      <div className="border-t border-black/5 dark:border-white/5 px-3 sm:px-4 pt-2 pb-2.5 bg-white/95 dark:bg-[#111318]/95">
        {/* Prévisualisation des pièces jointes */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((att) => {
              const isImage = att.type.startsWith("image/");
              const isVideo = att.type.startsWith("video/");

              return (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#181b24] text-[11px] text-slate-700 dark:text-slate-100"
                >
                  <span className="inline-flex items-center gap-1">
                    {isImage ? (
                      <ImageIcon className="w-3 h-3" />
                    ) : isVideo ? (
                      <VideoIcon className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    <span className="max-w-[120px] truncate">{att.name}</span>
                  </span>
                  <span className="opacity-70 text-[10px]">
                    {formatSize(att.size)}
                  </span>
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                      aria-label="Retirer la pièce jointe"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mb-1 text-[11px] text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Barre principale */}
        <div className="flex items-center gap-2">
          {/* Bouton PLUS (menu fichiers + emojis) */}
          <div className="relative shrink-0" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10"
              title="Plus d’options"
            >
              <Plus className="w-4 h-4" />
            </button>

            {moreOpen && (
              <div className="absolute bottom-11 left-0 z-50 w-40 rounded-xl bg-white dark:bg-[#111318] shadow-lg border border-black/10 dark:border-white/10 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    handleAttachClick();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1b1e27]"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Fichier</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    setEmojiOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1b1e27]"
                >
                  <SmilePlus className="w-4 h-4" />
                  <span>Emoji</span>
                </button>
              </div>
            )}
          </div>

          {/* Champ texte */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none no-scrollbar text-sm rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50/80 dark:bg-[#161922]/80 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 overflow-y-auto"
            />
          </div>

          <button
            type="button"
            onClick={handleSendClick}
            disabled={!canSend}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-violet-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-violet-700 shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
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

      {/* Panel EMOJI flottant (style WhatsApp, responsive) */}
      {emojiOpen && (
        <div
          ref={emojiRef}
          className="
            fixed
            inset-x-0
            bottom-20
            z-[200]
            flex
            justify-center
            px-2 sm:px-4
          "
        >
          <div className="w-[min(420px,100%)]">
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => setEmojiOpen(false)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                aria-label="Fermer les emojis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111318] overflow-hidden max-h-[60vh]">
              <div className="max-h-[60vh] overflow-y-auto">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: EmojiNative) => {
                    const native = emoji?.native || "";
                    if (native) {
                      handleSelectEmoji(native);
                    }
                    // on NE ferme PAS ici → l'utilisateur peut enchaîner plusieurs emojis
                  }}
                  theme="light"
                  navPosition="top"
                  previewPosition="none"
                  searchPosition="top"
                  className="!w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
