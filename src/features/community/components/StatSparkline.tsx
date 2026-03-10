// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\components\StatSparkline.tsx
import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function StatSparkline({
  title,
  value,
  data,
  className = "",
  height = 140,
}: {
  title: ReactNode;
  value: ReactNode;
  data: { date: string; value: number }[];
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 p-4 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-xs text-slate-400">30 jours</div>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-2 h-px w-full bg-slate-100 dark:bg-slate-800" />
      <div className="mt-3 h-[140px]">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,.2)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              stroke="rgba(100,116,139,.6)"
            />
            <YAxis
              width={36}
              tick={{ fontSize: 11 }}
              stroke="rgba(100,116,139,.6)"
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,.95)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 8,
                color: "#fff",
              }}
              // v = valeur numérique; on renvoie un tuple [valeur, libellé] typé
              formatter={(v: number) => [v, "Abonnés"] as [number, string]}
              labelStyle={{ color: "#cbd5e1" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7c3aed"
              fill="url(#gradFollowers)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
