// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\dashboard\charts.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { COLORS, tooltipFmt } from "./helpers";

const axisTick = { fontSize: 11 };
const CHART_MARGIN = { top: 8, right: 48, left: 8, bottom: 8 }; // équilibre visuel pour Area/Bar/Line
const Y_WIDTH = 40;

export function AreaGrossChart({
  data,
}: {
  data: Array<{ date: string; gross: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="date" tick={axisTick} />
        <YAxis width={Y_WIDTH} tick={axisTick} />
        <RTooltip formatter={(v) => tooltipFmt(v)} />
        <Area
          type="monotone"
          dataKey="gross"
          stroke={COLORS.indigo}
          fill="url(#gGross)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarOrdersChart({
  data,
}: {
  data: Array<{ date: string; orders: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="date" tick={axisTick} />
        <YAxis width={Y_WIDTH} allowDecimals={false} tick={axisTick} />
        <RTooltip />
        <Bar
          dataKey="orders"
          stroke={COLORS.emerald}
          fill={COLORS.emerald}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineDownloadsChart({
  data,
}: {
  data: Array<{ date: string; downloadsCum: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="date" tick={axisTick} />
        <YAxis width={Y_WIDTH} allowDecimals={false} tick={axisTick} />
        <RTooltip />
        <Line
          type="monotone"
          dataKey="downloadsCum"
          stroke={COLORS.cyan}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieStatusesChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  // Hauteur plus grande pour accueillir une légende sur 1–2 lignes
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart margin={{ top: 8, right: 12, left: 12, bottom: 56 }}>
        <Legend
          verticalAlign="bottom"
          align="center"
          height={40}
          wrapperStyle={{
            paddingTop: 6,
            textAlign: "center",
            width: "100%",
            lineHeight: "16px",
          }}
        />
        <RTooltip />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={54}
          outerRadius={90}
          paddingAngle={3}
          cx="50%"
          cy="42%" /* on remonte un peu le donut pour libérer la place de la légende */
        >
          {data.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
