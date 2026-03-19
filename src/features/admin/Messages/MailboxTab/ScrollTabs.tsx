// src/components/ui/ScrollTabs.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";

export type ScrollTabItem<K extends string = string> = {
  key: K;
  label: string;
  Icon?: ComponentType<{ className?: string }>;
};

type Props<K extends string = string> = {
  items: ScrollTabItem<K>[];
  /** Valeur contrôlée (sinon le composant gère son propre état) */
  value?: K;
  /** Valeur par défaut si non-contrôlé */
  defaultValue?: K;
  /** Callback de sélection */
  onChange?: (key: K) => void;
  /** Si fourni, l’onglet est synchronisé avec l’URL: ?{persistParam}=key */
  persistParam?: string;
  /** Classes wrapper externes */
  className?: string;
};

/** Barre d’onglets horizontale, scrollable au wheel, centrage auto de l’onglet actif. */
export default function ScrollTabs<K extends string>({
  items,
  value,
  defaultValue,
  onChange,
  persistParam,
  className = "",
}: Props<K>) {
  const [sp, setSp] = useSearchParams();
  const initialFromUrl = persistParam ? (sp.get(persistParam) as K | null) : null;

  const initial = ((): K => {
    if (value !== undefined) return value;
    if (initialFromUrl && items.some(i => i.key === initialFromUrl)) return initialFromUrl;
    if (defaultValue) return defaultValue;
    return items[0].key;
  })();

  const [inner, setInner] = useState<K>(initial);
  const active: K = value !== undefined ? value : inner;

  // sync URL à chaque changement (si demandé)
  useEffect(() => {
    if (!persistParam) return;
    const next = new URLSearchParams(sp);
    next.set(persistParam, active);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, persistParam]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // wheel horizontal
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // centre l’onglet actif
  useEffect(() => {
    const el = document.getElementById(`tab-${String(active)}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const setActive = (k: K) => {
    if (value === undefined) setInner(k);
    onChange?.(k);
  };

  const classes = useMemo(
    () =>
      `overflow-x-auto scroll-smooth rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface ${className}`,
    [className]
  );

  return (
    <div ref={scrollerRef} className={classes} aria-label="Barre d’onglets">
      <div role="tablist" className="flex gap-2 min-w-max p-2">
        {items.map(({ key, label, Icon }) => {
          const selected = key === active;
          return (
            <button
              key={key}
              id={`tab-${String(key)}`}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(key)}
              className={[
                "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap",
                selected ? "bg-[#7c3aed] text-white shadow" : "hover:bg-skin-tile text-skin-base",
              ].join(" ")}
            >
              {Icon ? <Icon className="w-4 h-4" /> : null}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
