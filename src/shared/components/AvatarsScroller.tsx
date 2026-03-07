// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\AvatarsScroller.tsx
import { Link } from "react-router-dom";
import { Star, Users as UsersIcon, Radio } from "lucide-react";

export type AvatarCard = {
  src: string;
  label: string;
  href?: string;
  rating?: number;
  subscribers?: number;
  live?: boolean;
};

function formatSubs(n?: number) {
  if (n == null) return "";
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "k";
  return String(n);
}

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="96" cy="96" r="82" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
    </svg>`
  );

function Item({ src, label, href, rating, subscribers, live }: AvatarCard) {
  const Image = (
    <div
      className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full p-[3px]
                 bg-gradient-to-tr from-violet-500/60 via-fuchsia-500/40 to-cyan-500/60"
      aria-label={label}
      title={label}
    >
      <div className="w-full h-full rounded-full bg-white/70 dark:bg-white/[0.06] p-[2px]">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== FALLBACK_SVG) img.src = FALLBACK_SVG;
          }}
          className="block w-full h-full rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shadow-sm"
        />
      </div>

      {live && (
        <span
          title="En direct"
          className="absolute top-1 left-1 z-10 inline-flex items-center gap-1
                     rounded-full px-1.5 py-[2px] bg-rose-600 text-white text-[10px] font-semibold shadow"
        >
          <Radio className="w-3 h-3" />
          LIVE
        </span>
      )}

      {rating != null && (
        <span
          title={`Note ${rating.toFixed(1)}`}
          className="absolute top-1 right-1 z-10 inline-flex items-center gap-0.5
                     rounded-full px-1.5 py-[2px] bg-black/75 text-white text-[10px] font-semibold backdrop-blur"
        >
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          {rating.toFixed(1)}
        </span>
      )}

      {!live && (
        <span
          title="En ligne"
          className="absolute bottom-0 right-0 z-10 w-3.5 h-3.5 rounded-full
                     bg-emerald-500 ring-2 ring-white dark:ring-[#0f1115]"
        />
      )}
    </div>
  );

  const Subs =
    subscribers != null ? (
      <div
        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                   bg-black/55 text-white text-[10px] backdrop-blur-sm"
        title={`${subscribers.toLocaleString()} abonnés`}
      >
        <UsersIcon className="w-3.5 h-3.5" />
        {formatSubs(subscribers)}
      </div>
    ) : null;

  const Content = (
    <div className="flex flex-col items-center w-[6.75rem] sm:w-[7.75rem]">
      {Image}
      {Subs}
      {/* ==> blanc en dark, sombre en light */}
      <div className="mt-2 text-[12px] text-center text-slate-900 dark:text-white truncate max-w-full">
        {label}
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="shrink-0 hover:opacity-95 transition-opacity">
      {Content}
    </Link>
  ) : (
    <div className="shrink-0">{Content}</div>
  );
}

export default function AvatarsScroller({
  title,
  items,
  className = "",
}: {
  title?: string;
  items: AvatarCard[];
  className?: string;
}) {
  if (!items?.length) return null;
  return (
    <section className={className}>
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
        {title && (
          <h3
            className="mb-3 text-lg sm:text-xl lg:text-2xl font-semibold
                       text-slate-900 dark:text-white underline decoration-violet-500/70 underline-offset-4"
          >
            {title}
          </h3>
        )}

        <div className="flex items-start gap-6 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {items.map((it, i) => (
            <div key={`${it.label}-${i}`} className="snap-start">
              <Item {...it} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
