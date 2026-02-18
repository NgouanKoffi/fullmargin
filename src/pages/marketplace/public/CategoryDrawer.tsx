// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\CategoryDrawer.tsx
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Store, Package, X, Grid3x3 } from "lucide-react";
import type { CategoryKey } from "./types";
import { listPublicCategories } from "../lib/publicShopApi";

type Props = {
  id?: string;
  open: boolean;
  onClose: () => void;
  onSelect: (key: CategoryKey) => void;
  selected: CategoryKey;
};

type CatItem = { key: string; label: string };

export default function CategoryDrawer({
  id = "drawer",
  open,
  onClose,
  onSelect,
  selected,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [cats, setCats] = useState<CatItem[]>([]);
  const [loading, setLoading] = useState(false);

  // charge les catégories la première fois qu’on ouvre
  useEffect(() => {
    if (!open || cats.length) return;
    (async () => {
      try {
        setLoading(true);
        const rows = await listPublicCategories();
        setCats(rows);
      } catch {
        setCats([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, cats.length]);

  // gestion focus/escape + no-scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => panelRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const base =
    "fixed inset-y-0 left-0 z-[70] w-[320px] max-w-[85vw] transform transition-transform duration-300 ease-out " +
    "bg-white dark:bg-neutral-950 border-r border-black/10 dark:border-white/10 shadow-xl";

  return (
    <>
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Catégories du marketplace"
        className={`${base} ${open ? "translate-x-0" : "-translate-x-full invisible"} md:hidden`}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white w-8 h-8 text-[13px] font-bold">
              FM
            </div>
            <div className="text-base font-semibold">Catégories</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3">
          <ul className="flex flex-col gap-2">
            {/* Boutiques */}
            <DrawerItem
              active={selected === "boutiques"}
              icon={<Store />}
              label="Boutiques"
              onClick={() => onSelect("boutiques")}
            />

            {/* Tous produits (par défaut) */}
            <DrawerItem
              active={selected === "all"}
              icon={<Grid3x3 />}
              label="Tous produits"
              onClick={() => onSelect("all")}
            />

            {/* Séparateur */}
            <li className="mt-1 mb-1 text-[11px] uppercase tracking-wide opacity-60 px-1">
              Produits par catégorie
            </li>

            {/* Catégories dynamiques */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100/70 dark:bg-neutral-800/50 animate-pulse"
                />
              ))
            ) : cats.length === 0 ? (
              <p className="text-xs opacity-70 px-1">Aucune catégorie</p>
            ) : (
              cats.map((c) => (
                <DrawerItem
                  key={c.key}
                  active={selected === c.key}
                  icon={<Package />}
                  label={c.label || c.key}
                  onClick={() => onSelect(c.key)}
                />
              ))
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function DrawerItem({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group relative w-full flex items-center justify-between gap-3 rounded-xl pl-3.5 pr-3.5 py-3 ring-1 transition-colors
          ${
            active
              ? "bg-neutral-50 dark:bg-neutral-900 ring-indigo-200/60 dark:ring-indigo-500/30"
              : "bg-white dark:bg-neutral-950 ring-black/10 dark:ring-white/10 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60"
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
      >
        <span
          className={`absolute left-0 top-0 h-full w-1 rounded-l-xl transition-opacity ${
            active
              ? "bg-indigo-500 opacity-100"
              : "opacity-0 group-hover:opacity-60 bg-black/10"
          }`}
          aria-hidden
        />
        <span className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ring-1 ring-black/10 dark:ring-white/10
              ${
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                  : "bg-neutral-100 dark:bg-neutral-800/60"
              }`}
          >
            <span className="[&>*]:w-[18px] [&>*]:h-[18px] opacity-90">
              {icon}
            </span>
          </span>
          <span
            className={`text-sm font-medium ${
              active ? "text-indigo-700 dark:text-indigo-300" : ""
            }`}
          >
            {label}
          </span>
        </span>
        <ChevronRight
          className={`w-4 h-4 ${active ? "opacity-80" : "opacity-60"}`}
        />
      </button>
    </li>
  );
}
