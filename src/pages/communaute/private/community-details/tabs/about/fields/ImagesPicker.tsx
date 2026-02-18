// src/pages/communaute/public/community-details/tabs/about/fields/ImagesPicker.tsx
import { Upload, Trash2 } from "lucide-react";

export default function ImagesPicker({
  coverPreview,
  logoPreview,
  onOpenLightbox,
  onPickCover,
  onPickLogo,
  onClearCover,
  onClearLogo,
}: {
  coverPreview: string;
  logoPreview: string;
  onOpenLightbox: (idx: number) => void;
  onPickCover: (f: File | null) => void;
  onPickLogo: (f: File | null) => void;
  onClearCover: () => void;
  onClearLogo: () => void;
}) {
  return (
    <div className="relative">
      <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-slate-50/90 dark:bg-slate-900/50 relative">
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="block w-full text-left"
          title="Voir en grand"
        >
          <div className="h-44 sm:h-52 md:h-56 lg:h-60 overflow-hidden rounded-2xl">
            <img
              src={coverPreview}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          </div>
        </button>

        {/* actions cover */}
        <div className="absolute right-3.5 bottom-3.5 z-10 flex items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3.5 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-white/90 dark:hover:bg-slate-900 cursor-pointer">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={onClearCover}
            className="inline-flex items-center gap-2 rounded-lg bg-white/90 dark:bg-slate-950/80 text-slate-700 dark:text-slate-100 px-3 py-2 text-sm ring-1 ring-black/10 hover:bg-white dark:hover:bg-slate-900"
            title="Retirer la couverture"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Logo + actions */}
      <div className="absolute left-4 sm:left-6 -bottom-8 sm:-bottom-10 z-20 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onOpenLightbox(1)}
          className="inline-flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900/80 shadow-xl bg-black/20 overflow-hidden"
          title="Voir en grand"
        >
          <img
            src={logoPreview}
            alt="Logo"
            className="h-full w-full object-cover"
          />
        </button>
        <div className="flex items-center gap-2">
          <label
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 ring-1 ring-black/10 shadow hover:bg-white/90 dark:hover:bg-slate-900 cursor-pointer"
            title="Changer le logo"
          >
            <Upload className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={onClearLogo}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-slate-950 text-slate-700 dark:text-slate-100 ring-1 ring-black/10 shadow hover:bg-white dark:hover:bg-slate-900"
            title="Retirer"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
