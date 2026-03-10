import { Link } from "react-router-dom";
import { PlayCircle, Eye, ThumbsUp, MessageCircle } from "lucide-react";
import { useMemo } from "react";

export const ring = "ring-1 ring-black/5 dark:ring-white/10";
export const softCard =
  "rounded-2xl bg-white/80 dark:bg-white/[0.06] " +
  ring +
  " shadow-[0_1px_0_0_rgba(0,0,0,.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,.06)]";

export function Pill({
  active,
  children,
  className = "",
}: {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-2 text-xs sm:text-[13px] whitespace-nowrap ${
        active
          ? "bg-violet-600 text-white ring-1 ring-violet-700"
          : "bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 " +
            ring
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function WatchCard(props: {
  title: string;
  subtitle: string;
  href: string;
  statViews: string;
  statLikes: string;
  statComments: string;
  gradient?: string;
}) {
  const grad =
    props.gradient || "from-indigo-500 via-violet-500 to-fuchsia-500";
  return (
    <Link
      to={props.href}
      className={`group ${softCard} p-3 sm:p-4 overflow-hidden relative hover:bg-white/90 dark:hover:bg-white/[0.09] transition-colors`}
    >
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-tr ${grad} opacity-20`}
      />
      <div className="relative z-10 flex items-center gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10">
          <PlayCircle className="w-6 h-6 opacity-90" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {props.title}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {props.subtitle}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3 sm:mt-4 grid grid-cols-3 gap-2 text-[12px] text-slate-600 dark:text-slate-300">
        <div className={`${softCard} px-2 py-1.5 flex items-center gap-1.5`}>
          <Eye className="w-3.5 h-3.5" />
          <span>{props.statViews}</span>
        </div>
        <div className={`${softCard} px-2 py-1.5 flex items-center gap-1.5`}>
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{props.statLikes}</span>
        </div>
        <div className={`${softCard} px-2 py-1.5 flex items-center gap-1.5`}>
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{props.statComments}</span>
        </div>
      </div>
    </Link>
  );
}

export function TinyChart() {
  const pts = useMemo(
    () => [35, 42, 28, 55, 48, 67, 60, 80, 62, 74, 58, 71],
    []
  );
  const width = 520;
  const height = 120;
  const step = width / (pts.length - 1);
  const path = pts
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${i * step} ${height - (v / 100) * height}`
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[140px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#g1)"
      />
      <path d={path} fill="none" stroke="rgb(99 102 241)" strokeWidth="2.5" />
    </svg>
  );
}
