import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Shimmer from "./Shimmer";

export type HeroItem = {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  discountLabel?: string;
  discountValue?: string;
  cta?: string;
  imageUrl: string;
  href?: string;
};

function preload(src?: string | null) {
  if (!src) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

type Props = {
  items: HeroItem[];
  className?: string;
  autoplay?: boolean;
  intervalMs?: number;
};

export default function HeroSlider({
  items,
  className = "",
  autoplay = true,
  intervalMs = 6000,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [bootLoading, setBootLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const hovering = useRef(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all(items.map((it) => preload(it.imageUrl)));
      if (mounted) setBootLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [items]);

  const next = useCallback(
    () => setIdx((v) => (items.length ? (v + 1) % items.length : 0)),
    [items.length],
  );
  const prev = useCallback(
    () =>
      setIdx((v) => (items.length ? (v - 1 + items.length) % items.length : 0)),
    [items.length],
  );

  useEffect(() => {
    if (!autoplay || items.length === 0) return;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      if (!hovering.current) next();
    }, intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [autoplay, intervalMs, next, items.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) > 40) {
      if (delta > 0) prev();
      else next();
    }
  };

  const translate = useMemo(() => `translateX(-${idx * 100}%)`, [idx]);

  return (
    <section
      // CORRECTION HAUTEUR : On réduit à 420px sur mobile pour éviter l'effet "vide"
      className={`relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 shadow-sm border border-black/5 dark:border-white/5 h-[420px] md:h-[450px] ${className}`}
      onMouseEnter={() => {
        hovering.current = true;
      }}
      onMouseLeave={() => {
        hovering.current = false;
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Promotions"
    >
      {bootLoading && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <Shimmer className="w-full h-full rounded-none" />
        </div>
      )}

      <div
        className="flex w-full h-full will-change-transform transition-transform duration-500 ease-out"
        style={{ transform: translate }}
      >
        {items.map((it) => (
          <Slide key={it.id} item={it} />
        ))}
      </div>

      {/* NAVIGATION */}
      <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center pointer-events-none md:justify-start md:left-10 md:bottom-8">
        {/* Points centrés sur mobile, alignés gauche sur desktop si besoin */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/50 dark:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full md:bg-transparent md:backdrop-blur-none md:px-0">
          {items.map((_, i) => (
            <button
              key={`dot-${i}`}
              className={`h-1.5 rounded-full transition-all shadow-sm ${
                i === idx
                  ? "w-6 bg-slate-900 dark:bg-white"
                  : "w-2 bg-slate-400 dark:bg-white/40 hover:bg-slate-600"
              }`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:flex absolute bottom-8 right-10 items-center gap-2 pointer-events-auto z-10">
        <button
          onClick={prev}
          className="p-2 rounded-full bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white transition shadow-sm border border-black/5 dark:border-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="p-2 rounded-full bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white transition shadow-sm border border-black/5 dark:border-white/10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

function Slide({ item }: { item: HeroItem }) {
  const Cta = item.href ? "a" : "button";
  const ctaProps = item.href
    ? { href: item.href, role: "link" }
    : { type: "button" as const };

  return (
    <article className="shrink-0 w-full h-full flex flex-col md:grid md:grid-cols-2">
      {/* 1. IMAGE (HAUT MOBILE / DROITE DESKTOP)
         - Mobile : h-[45%] pour laisser la place au texte.
         - Desktop : Order-2 pour être à droite.
      */}
      <div className="order-1 md:order-2 bg-slate-50 dark:bg-black/20 h-[45%] md:h-full w-full flex items-center justify-center p-6 relative overflow-hidden">
        {/* Effet déco cercle arrière plan pour donner du volume */}
        <div className="absolute w-48 h-48 bg-slate-200/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <img
          src={item.imageUrl}
          alt=""
          className="relative z-10 h-full w-auto max-w-full object-contain drop-shadow-xl transition-transform duration-500 hover:scale-105"
          draggable={false}
        />
      </div>

      {/* 2. TEXTE (BAS MOBILE / GAUCHE DESKTOP)
         - Mobile : flex-1 (prend tout le reste de la place).
         - Padding réduit (p-5) sur mobile pour éviter d'écraser.
      */}
      <div className="order-2 md:order-1 flex-1 md:h-full bg-white dark:bg-neutral-900 flex flex-col justify-center items-start p-5 md:p-12 lg:p-16 relative">
        <div className="w-full">
          {item.kicker && (
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
              {item.kicker}
            </p>
          )}

          <h2 className="text-xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2 md:line-clamp-3 mb-2 md:mb-4">
            {item.title}
          </h2>

          {item.subtitle && (
            <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 md:mb-6 leading-relaxed">
              {item.subtitle}
            </p>
          )}

          <Cta
            {...ctaProps}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 md:px-6 md:py-3 text-xs md:text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            {item.cta ?? "Découvrir"}
            <ChevronRight className="w-4 h-4" />
          </Cta>
        </div>
      </div>
    </article>
  );
}
