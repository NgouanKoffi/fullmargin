import type { JournalEntry } from "../../types";

export type StrategyStats = {
  trades: number;
  wins: number;
  breakeven: number;
  invested: number;
  gain: number;
  loss: number;
  net: number;
  dd: number;
  series: { x: number; y: number }[];
};

const n2 = (v: unknown) => Number(String(v ?? "").replace(",", "."));

export function buildStatsByStrategy(entries: JournalEntry[]) {
  const map = new Map<string, StrategyStats>();
  const grouped = new Map<string, JournalEntry[]>();

  for (const e of entries) {
    if (!e.strategyId) continue;
    if (!grouped.has(e.strategyId)) grouped.set(e.strategyId, []);
    grouped.get(e.strategyId)!.push(e);
  }

  for (const [strategyId, arr] of grouped.entries()) {
    arr.sort((a, b) =>
      (a.date || a.createdAt).localeCompare(b.date || b.createdAt)
    );
    let cum = 0;
    let peak = 0;
    let dd = 0;
    const stats: StrategyStats = {
      trades: 0,
      wins: 0,
      breakeven: 0,
      invested: 0,
      gain: 0,
      loss: 0,
      net: 0,
      dd: 0,
      series: [],
    };
    for (const e of arr) {
      const inv = n2(e.invested);
      const pnl = n2(e.resultMoney);
      if (Number.isFinite(inv)) stats.invested += inv;
      if (Number.isFinite(pnl)) {
        if (pnl > 0) stats.gain += pnl;
        else if (pnl < 0) stats.loss += Math.abs(pnl);
      }
      stats.trades++;
      if (e.result === "Gain") stats.wins++;
      if (e.result === "Nul") stats.breakeven++;

      cum += Number.isFinite(pnl) ? pnl : 0;
      peak = Math.max(peak, cum);
      dd = Math.min(dd, cum - peak);
      stats.series.push({
        x: new Date(e.date || e.createdAt).getTime(),
        y: cum,
      });
    }
    stats.net = stats.gain - stats.loss;
    stats.dd = Math.abs(dd);
    map.set(strategyId, stats);
  }

  return map;
}
