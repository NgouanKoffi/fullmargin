// src/pages/journal/tabs/view/KpiGrid.tsx
import {
  Calendar,
  BarChart2,
  TrendingUp,
  Trophy,
  XCircle,
  CircleDashed,
} from "lucide-react";
import { KpiCard } from "./ui";

export default function KpiGrid({
  kpi,
  currencySign,
}: {
  kpi: {
    pnl: number;
    invested: number;
    wins: number;
    losses: number;
    ties: number;
    total: number;
    winRate: number;
  };
  currencySign: string;
}) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 px-4 lg:px-0">
      {/* 1. PnL */}
      <KpiCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="PnL cumulé"
        value={`${kpi.pnl.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${currencySign}`}
      />

      {/* 2. Investi */}
      <KpiCard
        icon={<BarChart2 className="w-4 h-4" />}
        label="Investi cumulé"
        value={`${kpi.invested.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${currencySign}`}
      />

      {/* 3. Trades gagnants */}
      <KpiCard
        icon={<Trophy className="w-4 h-4" />}
        label="Trades gagnants"
        value={kpi.wins}
      />

      {/* 4. Trades perdants */}
      <KpiCard
        icon={<XCircle className="w-4 h-4" />}
        label="Trades perdants"
        value={kpi.losses}
      />

      {/* 5. Trades nuls */}
      <KpiCard
        icon={<CircleDashed className="w-4 h-4" />}
        label="Trades nuls"
        value={kpi.ties}
      />

      {/* 6. Win rate (on garde) */}
      <KpiCard
        icon={<Calendar className="w-4 h-4" />}
        label="Win rate"
        value={`${kpi.winRate.toFixed(1)}%`}
      />
    </div>
  );
}
