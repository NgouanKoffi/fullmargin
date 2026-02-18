// src/components/Home/TickerTape.tsx
import { useEffect, useMemo, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion";

type Props = {
  /** Durée d’un cycle de défilement (sec) */
  speed?: number;
  /** Pourcentage du fondu latéral en mobile (0–10). Par défaut 3% */
  edgeMobile?: number;
  /** Pourcentage du fondu latéral en ≥md (0–10). Par défaut 6% */
  edgeDesktop?: number;
};

/**
 * Ruban de prix — version immersive :
 * - défilement continu (séquence dupliquée)
 * - tilt 3D au curseur (perspective)
 * - vitesse modulée par le scroll
 * - glow & reflet adaptatifs dark/light
 */
export default function TickerTape({
  speed = 40,
  edgeMobile = 3,
  edgeDesktop = 6,
}: Props) {
  const items = useMemo(
    () => [
      { s: "BTC/USD", p: 64815.8, d: +0.24 },
      { s: "ETH/USD", p: 3171.7, d: -0.01 },
      { s: "XAU/USD", p: 2421.46, d: +0.18 },
      { s: "EUR/USD", p: 1.142, d: +0.12 },
      { s: "SOL/USD", p: 169.23, d: +0.42 },
      { s: "AAPL", p: 225.14, d: -0.05 },
      { s: "NVDA", p: 118.72, d: +0.31 },
      { s: "US10Y", p: 4.21, d: -0.02 },
    ],
    []
  );

  // bornes de sécurité pour les masques
  const em = Math.max(0, Math.min(edgeMobile, 10));
  const ed = Math.max(0, Math.min(edgeDesktop, 10));
  const emR = 100 - em;
  const edR = 100 - ed;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  /* ✅ Assurer une position non statique sur le container observé par useScroll */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const pos = getComputedStyle(el).position;
    if (pos === "static") {
      el.style.position = "relative";
    }
  }, []);

  /* ====== Scroll → moduler la durée de l’animation ====== */
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    if (!trackRef.current) return;
    // map [0→1] vers facteur [1 → 0.75] (un peu plus lent en bas)
    const unsub = scrollYProgress.on("change", (v) => {
      const factor = 1 - 0.25 * v; // 1..0.75
      const dur = Math.max(8, speed * factor); // garde une borne min
      trackRef.current!.style.setProperty("--fmTickerDur", `${dur}s`);
    });
    // init
    trackRef.current.style.setProperty("--fmTickerDur", `${speed}s`);
    return () => unsub && unsub();
  }, [speed, scrollYProgress]);

  /* ====== Parallax 3D au curseur ====== */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), {
    stiffness: 120,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), {
    stiffness: 120,
    damping: 18,
  });

  function onMouseMove(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5); // [-0.5, 0.5]
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className={`
        fm-ticker-wrap relative overflow-hidden rounded-full
        ring-1 ring-skin-border/20 bg-skin-surface
        -mx-4 sm:-mx-6 md:mx-0
        [perspective:1200px]
      `}
    >
      <style>
        {`
        .fm-ticker { width: max-content; will-change: transform; animation: fm-ticker-move var(--fmTickerDur, ${speed}s) linear infinite; }
        @keyframes fm-ticker-move { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .fm-ticker { animation: none !important; } }

        /* Masque latéral: plus serré en mobile, plus large ensuite */
        .fm-ticker-wrap{
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 ${ed}%, #000 ${edR}%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 ${ed}%, #000 ${edR}%, transparent);
        }
        @media (max-width: 767px){
          .fm-ticker-wrap{
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 ${em}%, #000 ${emR}%, transparent);
                    mask-image: linear-gradient(90deg, transparent, #000 ${em}%, #000 ${emR}%, transparent);
          }
        }
      `}
      </style>

      {/* Glow d’ambiance derrière le ruban */}
      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
        aria-hidden
      >
        <div className="absolute inset-0 blur-2xl rounded-[64px] bg-fm-primary/15 dark:bg-fm-primary/12" />
      </motion.div>

      {/* Reflet qui balaye — s’illumine quand on survole */}
      <div
        className="
          pointer-events-none absolute inset-0 rounded-full overflow-hidden
        "
        aria-hidden
      >
        <div
          className="
            absolute inset-y-0 -left-1/3 w-1/3
            bg-gradient-to-r from-white/0 via-white/25 to-white/0
            dark:via-white/10
            animate-[shine_4.5s_linear_infinite]
          "
        />
        <style>
          {`@keyframes shine { 0% { transform: translateX(-20%); } 100% { transform: translateX(320%); } }`}
        </style>
      </div>

      {/* Track 3D : tilt global */}
      <motion.div
        ref={trackRef}
        style={{ rotateX: rx, rotateY: ry }}
        className="fm-ticker flex items-center will-change-transform"
      >
        {/* Séquence A */}
        <ul className="flex flex-none items-center gap-2.5 sm:gap-4 px-1.5 sm:px-3 py-2">
          {items.map((it) => {
            const up = it.d >= 0;
            return (
              <li
                key={`A-${it.s}`}
                className="
                  group/tk flex-none flex items-center gap-2
                  px-2.5 sm:px-3 py-1 rounded-full
                  ring-1 ring-skin-border/30 bg-skin-surface
                  transition-transform will-change-transform
                  hover:scale-[1.03] hover:-translate-y-0.5
                "
              >
                <span className="text-[11px] sm:text-xs font-semibold">
                  {it.s}
                </span>
                <span className="text-[11px] sm:text-xs text-skin-muted">
                  {it.p}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold ${
                    up ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {up ? "▲" : "▼"} {Math.abs(it.d).toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ul>

        {/* Séquence B (copie) */}
        <ul
          className="flex flex-none items-center gap-2.5 sm:gap-4 px-1.5 sm:px-3 py-2"
          aria-hidden="true"
        >
          {items.map((it) => {
            const up = it.d >= 0;
            return (
              <li
                key={`B-${it.s}`}
                className="
                  group/tk flex-none flex items-center gap-2
                  px-2.5 sm:px-3 py-1 rounded-full
                  ring-1 ring-skin-border/30 bg-skin-surface
                  transition-transform will-change-transform
                  hover:scale-[1.03] hover:-translate-y-0.5
                "
              >
                <span className="text-[11px] sm:text-xs font-semibold">
                  {it.s}
                </span>
                <span className="text-[11px] sm:text-xs text-skin-muted">
                  {it.p}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold ${
                    up ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {up ? "▲" : "▼"} {Math.abs(it.d).toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
