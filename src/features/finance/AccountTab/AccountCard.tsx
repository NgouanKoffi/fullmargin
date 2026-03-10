// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\finance\AccountTab\AccountCard.tsx
import { useEffect, useRef } from "react";
import { Pencil, Trash2, Wallet2, Eye } from "lucide-react";
import type { Account, Currency } from "../core/types";
import { fmtMoney } from "../core/types";

/* ---------- mini sparkline (canvas) ---------- */
export function Sparkline({
  points,
  className,
  height = 160,
}: {
  points: Array<{ x: number; y: number }>;
  className?: string;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const el = ref.current;
      if (!el) return;

      const w = el.parentElement?.clientWidth ?? 540;
      el.width = Math.max(200, w);
      el.height = height;

      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, el.width, el.height);

      // grille
      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 1;
      const gx = 6;
      for (let i = 1; i < gx; i++) {
        const x = (i * el.width) / gx;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, el.height);
        ctx.stroke();
      }
      const gy = 4;
      for (let j = 1; j < gy; j++) {
        const y = (j * el.height) / gy;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(el.width, y);
        ctx.stroke();
      }

      if (points.length < 2) return;

      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const pad = 8;

      const scaleX = (x: number) =>
        pad +
        (maxX === minX
          ? 0
          : ((x - minX) / (maxX - minX)) * (el.width - pad * 2));
      const scaleY = (y: number) =>
        el.height -
        pad -
        (maxY === minY
          ? 0
          : ((y - minY) / (maxY - minY)) * (el.height - pad * 2));

      // aire
      ctx.beginPath();
      ctx.moveTo(scaleX(points[0].x), scaleY(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(scaleX(points[i].x), scaleY(points[i].y));
      }
      ctx.lineTo(scaleX(points[points.length - 1].x), el.height - pad);
      ctx.lineTo(scaleX(points[0].x), el.height - pad);
      ctx.closePath();
      ctx.fillStyle = "rgba(99,102,241,0.10)";
      ctx.fill();

      // courbe
      ctx.beginPath();
      ctx.moveTo(scaleX(points[0].x), scaleY(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(scaleX(points[i].x), scaleY(points[i].y));
      }
      ctx.strokeStyle = "rgba(99,102,241,1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // dernier point
      const last = points[points.length - 1];
      ctx.fillStyle = "rgba(99,102,241,1)";
      ctx.beginPath();
      ctx.arc(scaleX(last.x), scaleY(last.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [points, height]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height }}
    />
  );
}

/* ---------- carte compte ---------- */
export default function AccountCard({
  a,
  onEdit,
  onDelete,
  stats,
  overrideCurrency,
  onShowDetails,
}: {
  a: Account;
  onEdit: () => void;
  onDelete: () => void;
  stats: { income: number; expense: number };
  overrideCurrency?: Currency;
  onShowDetails: () => void;
}) {
  const effectiveCur = (overrideCurrency ?? a.currency) as Currency;

  const color =
    effectiveCur === "USD"
      ? "from-indigo-500 to-sky-500"
      : effectiveCur === "EUR"
      ? "from-emerald-500 to-lime-500"
      : "from-fuchsia-500 to-rose-500";

  const totalIncome = stats.income;
  const totalExpense = stats.expense;
  const balance = (Number(a.initial) || 0) + totalIncome - totalExpense;

  const balColor =
    balance < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-emerald-700 dark:text-emerald-300";

  return (
    <article className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition hover:shadow-lg">
      <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

      {/* header */}
      <header
        className="
          flex flex-wrap
          items-center justify-between
          gap-3
          p-4
        "
      >
        {/* bloc titre */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "h-11 w-11 grid place-items-center rounded-xl text-white shadow-sm",
              "bg-gradient-to-br",
              color,
            ].join(" ")}
          >
            <Wallet2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold leading-tight truncate">{a.name}</h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {effectiveCur}
              </span>
              <span className="text-[11px] text-slate-500">
                ID&nbsp;: {a.id.slice(0, 6)}…
              </span>
            </div>
          </div>
        </div>

        {/* actions */}
        <div
          className="
            flex items-center gap-2 shrink-0
            max-[310px]:w-full
            max-[310px]:pt-1.5
            max-[310px]:justify-start
          "
        >
          {/* bouton détails */}
          <button
            onClick={onShowDetails}
            aria-label="Voir les détails"
            title="Voir les détails"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onEdit}
            aria-label="Modifier le compte"
            title="Modifier"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Supprimer le compte"
            title="Supprimer"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* contenu bas */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="tabular-nums">
            {fmtMoney(Number(a.initial) || 0, effectiveCur)}
          </span>
          <span className="text-slate-400 text-xs">· solde initial</span>
        </div>
        <div className={`text-sm font-semibold tabular-nums ${balColor}`}>
          Solde actuel&nbsp;: {fmtMoney(balance, effectiveCur)}
        </div>
      </div>
    </article>
  );
}
