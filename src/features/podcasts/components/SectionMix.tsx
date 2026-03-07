// src/pages/podcasts/SectionMix.tsx
import { Search } from "lucide-react";

type LangFilter = "all" | "fr" | "en";

export default function SectionMix({
  title,
  subtitle,
  query,
  setQuery,
  language = "all",
  setLanguage,
  showOnlyNew = false,
  setShowOnlyNew,
  children,
}: {
  title: string;
  subtitle?: string;
  query: string;
  setQuery: (v: string) => void;
  language?: LangFilter;
  setLanguage?: (v: LangFilter) => void;
  showOnlyNew?: boolean;
  setShowOnlyNew?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl ring-1 ring-skin-border/20 bg-skin-surface p-5 shadow-sm relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40 bg-fm-primary/20" />

      {/* header titre */}
      <div className="min-w-0 mb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-skin-border/20 bg-skin-inset">
          {title}
        </div>
        {subtitle && (
          <p className="mt-2 text-sm text-skin-muted max-w-[70ch]">
            {subtitle}
          </p>
        )}
      </div>

      {/* barre de recherche + filtres */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        {/* recherche */}
        <div className="relative w-full md:max-w-[380px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-skin-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Que souhaitez-vous écouter ou regarder ?"
            className="w-full rounded-2xl bg-skin-inset pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-skin-ring placeholder:text-skin-muted"
          />
        </div>

        {/* filtres */}
        <div className="flex flex-wrap gap-3">
          {setLanguage && (
            <div className="grid grid-cols-3 rounded-2xl ring-1 ring-skin-border/30 bg-skin-inset p-1 text-[12px] font-semibold min-w-[210px]">
              <SegBtn
                active={language === "all"}
                onClick={() => setLanguage("all")}
                label="Tous"
              />
              <SegBtn
                active={language === "fr"}
                onClick={() => setLanguage("fr")}
                label="Français"
              />
              <SegBtn
                active={language === "en"}
                onClick={() => setLanguage("en")}
                label="Anglais"
              />
            </div>
          )}

          {setShowOnlyNew && (
            <button
              type="button"
              onClick={() => setShowOnlyNew(!showOnlyNew)}
              className={`px-4 py-2 rounded-2xl text-[12px] font-semibold transition ${
                showOnlyNew
                  ? "bg-fm-primary text-skin-primary-foreground"
                  : "bg-skin-inset text-skin-base/80 hover:bg-skin-tile-strong"
              }`}
            >
              {showOnlyNew ? "Nouveaux seulement" : "Tout le contenu"}
            </button>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function SegBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl transition ${
        active
          ? "bg-fm-primary text-skin-primary-foreground shadow-sm"
          : "text-skin-base/80 hover:bg-skin-tile-strong"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
