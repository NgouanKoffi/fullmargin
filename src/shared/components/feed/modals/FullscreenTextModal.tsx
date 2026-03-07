import { X } from "lucide-react";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import useKey from "../hooks/useKey";

export default function FullscreenTextModal({
  open,
  onClose,
  author,
  createdAt,
  content,
}: {
  open: boolean;
  onClose: () => void;
  author: { name: string; avatar?: string };
  createdAt: string;
  content: string;
}) {
  useLockBodyScroll(open);
  useKey("Escape", () => open && onClose(), open);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 m-0 lg:m-6 rounded-none lg:rounded-2xl overflow-hidden bg-white dark:bg-[#0b0b0f] ring-1 ring-black/10 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 h-14 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur border-b border-black/10 dark:border-white/10">
          <img
            src={author.avatar ?? "https://i.pravatar.cc/64?img=12"}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">
              {author.name}
            </div>
            <time className="text-xs text-slate-500">
              {new Date(createdAt).toLocaleString()}
            </time>
          </div>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center justify-center rounded-xl h-9 w-9 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 sm:px-6 py-4 h-[calc(100%-56px)] overflow-y-auto">
          <article className="mx-auto max-w-3xl">
            {content.split("\n").map((p, i) => (
              <p
                key={i}
                className="whitespace-pre-wrap text-[15px] sm:text-base leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
