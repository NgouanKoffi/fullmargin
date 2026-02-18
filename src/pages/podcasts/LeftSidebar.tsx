// src/pages/podcasts/LeftSidebar.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Menu, X } from "lucide-react";
import type { SidebarItem } from "./types";
import { cx } from "./utils";

export default function LeftSidebar({
  active,
  onSelect,
  primary,
  categories,
  categoryCounts = {},
  playlistCount = 0,
}: {
  active: string;
  onSelect: (label: string) => void;
  primary: SidebarItem[];
  categories: SidebarItem[];
  categoryCounts?: Record<string, number>;
  playlistCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* bouton mobile flottant */}
      <MobileTrigger onOpen={() => setMobileOpen(true)} />

      {/* drawer rendu dans body */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        active={active}
        onSelect={(label) => {
          onSelect(label);
          setMobileOpen(false);
        }}
        primary={primary}
        categories={categories}
        categoryCounts={categoryCounts}
        playlistCount={playlistCount}
      />

      {/* version desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 space-y-4">
          <SidebarSection
            title="Explorer"
            items={primary}
            active={active}
            onSelect={onSelect}
            playlistCount={playlistCount}
          />
          <SidebarSection
            title="Catégories"
            items={categories}
            active={active}
            onSelect={onSelect}
            categoryCounts={categoryCounts}
          />
        </div>
      </aside>
    </>
  );
}

/* ========== bouton flottant mobile ========== */
function MobileTrigger({ onOpen }: { onOpen: () => void }) {
  const style: React.CSSProperties = {
    top: "calc(env(safe-area-inset-top, 0px) + 64px)",
    right: "calc(env(safe-area-inset-right, 0px) + 12px)",
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      className="lg:hidden fixed z-40 h-11 w-11 rounded-full bg-skin-surface/90 ring-1 ring-skin-border/30 shadow-lg grid place-items-center hover:bg-skin-surface active:scale-95 transition"
      style={style}
      aria-label="Ouvrir le menu des filtres"
    >
      <Menu className="h-5 w-5 text-skin-base" />
    </button>
  );
}

/* ========== drawer mobile (portal) ========== */
function MobileDrawer(props: {
  open: boolean;
  onClose: () => void;
  active: string;
  onSelect: (label: string) => void;
  primary: SidebarItem[];
  categories: SidebarItem[];
  categoryCounts?: Record<string, number>;
  playlistCount?: number;
}) {
  // si on n’est pas dans le browser, on rend rien
  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(<MobileDrawerInner {...props} />, document.body);
}

function MobileDrawerInner({
  open,
  onClose,
  active,
  onSelect,
  primary,
  categories,
  categoryCounts = {},
  playlistCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  active: string;
  onSelect: (label: string) => void;
  primary: SidebarItem[];
  categories: SidebarItem[];
  categoryCounts?: Record<string, number>;
  playlistCount?: number;
}) {
  // ESC pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // quand c’est ouvert, on bloque le scroll du body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={cx(
        "fixed inset-0 z-[110]",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* overlay pleine page */}
      <div
        onClick={onClose}
        className={cx(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* panneau droite */}
      <aside
        className={cx(
          "absolute right-0 top-0 bottom-0 w-[86vw] max-w-[380px]",
          "bg-skin-surface ring-1 ring-skin-border/20 rounded-l-2xl shadow-2xl",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* header fixe */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border/15 bg-skin-surface/90 supports-[backdrop-filter]:backdrop-blur-md">
          <div>
            <div className="text-xs font-semibold text-skin-muted uppercase tracking-wide">
              Podcasts
            </div>
            <h2 className="text-base font-bold">Explorer & Catégories</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-skin-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* contenu scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          <SidebarSection
            title="Explorer"
            items={primary}
            active={active}
            onSelect={onSelect}
            playlistCount={playlistCount}
          />
          <SidebarSection
            title="Catégories"
            items={categories}
            active={active}
            onSelect={onSelect}
            categoryCounts={categoryCounts}
          />
        </div>
      </aside>
    </div>
  );
}

/* ========== section réutilisable ========== */
function SidebarSection({
  title,
  items,
  active,
  onSelect,
  categoryCounts = {},
  playlistCount = 0,
}: {
  title: string;
  items: SidebarItem[];
  active: string;
  onSelect: (label: string) => void;
  categoryCounts?: Record<string, number>;
  playlistCount?: number;
}) {
  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface shadow-sm overflow-hidden">
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-skin-muted">
        {title}
      </div>
      <ul className="p-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.label;
          const isPlaylist = it.label.toLowerCase() === "playlist";
          const count = isPlaylist
            ? playlistCount
            : categoryCounts[it.label] ?? 0;

          return (
            <li key={it.label}>
              <button
                className={cx(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition",
                  isActive
                    ? "bg-fm-primary/15 text-fm-primary"
                    : "hover:bg-skin-inset"
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelect(it.label)}
              >
                <Icon
                  className={cx(
                    "h-4 w-4",
                    isActive ? "text-fm-primary" : "text-skin-muted"
                  )}
                />
                <span
                  className={cx(
                    "text-sm flex-1 text-left",
                    isActive ? "text-fm-primary" : "text-skin-base"
                  )}
                >
                  {it.label}
                </span>
                {count && count > 0 ? (
                  <span className="inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-900 dark:bg-white/10 dark:text-white">
                    {count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
