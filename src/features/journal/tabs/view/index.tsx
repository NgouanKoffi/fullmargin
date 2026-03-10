import { useEffect, useMemo, useState } from "react";
import {
  listJournal,
  getJournal,
  listJournalAccounts,
  listMarkets,
  listStrategies,
} from "../../api";
import type { JournalEntry, Option, Currency } from "../../types";
import FiltersBar from "./FiltersBar";
import { EMPTY_FILTERS, type Filters } from "./filters";
import KpiGrid from "./KpiGrid";
import ChartsGrid from "./ChartsGrid";

/** symbole de devise (version sans crypto) */
const CURRENCY_SIGN: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  FCFA: "F CFA",
  FCFA_BEAC: "F CFA",
  XOF: "F CFA",
  XAF: "F CFA",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CNY: "¥",
  CHF: "CHF",
  NGN: "₦",
  ZAR: "R",
  MAD: "د.م.",
  INR: "₹",
  AED: "د.إ",
  GHS: "₵",
  KES: "KSh",
};

function currencySign(cur: Currency | string) {
  const u = cur.toUpperCase() as Currency;
  return CURRENCY_SIGN[u] || u || "$";
}

const d10 = (iso: string) => (iso || "").slice(0, 10);

// parse nombre venant du journal ("123,45", "  12 "…)
const n2 = (v: unknown) =>
  Number(
    String(v ?? "")
      .replace(/\s/g, "")
      .replace(",", ".")
  );

export default function ViewTab() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const [accounts, setAccounts] = useState<Option[]>([]);
  const [markets, setMarkets] = useState<Option[]>([]);
  const [strategies, setStrategies] = useState<Option[]>([]);

  const [globalCurrency, setGlobalCurrency] = useState<Currency>("USD");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [journalRes, accountsRes, marketsRes, strategiesRes] =
          await Promise.all([
            listJournal({ limit: 2000 }),
            listJournalAccounts({ limit: 200 }),
            listMarkets({ limit: 200 }),
            listStrategies({ limit: 200 }),
          ]);

        const fullEntries = await Promise.all(
          journalRes.items.map(async (item) => {
            try {
              const doc = await getJournal(item.id);
              return doc as unknown as JournalEntry;
            } catch {
              return null;
            }
          })
        );

        if (!alive) return;

        setEntries(fullEntries.filter(Boolean) as JournalEntry[]);

        setAccounts([
          { id: "", name: "— Tous —" },
          ...accountsRes.items.map((a) => ({ id: a.id, name: a.name })),
        ]);

        setMarkets([
          { id: "", name: "— Tous —" },
          ...marketsRes.items.map((m) => ({ id: m.id, name: m.name })),
        ]);

        setStrategies([
          { id: "", name: "— Toutes —" },
          ...strategiesRes.items.map((s) => ({ id: s.id, name: s.name })),
        ]);

        // devise dominante
        if (accountsRes.items.length > 0) {
          const freq = new Map<string, number>();
          for (const a of accountsRes.items) {
            freq.set(a.currency, (freq.get(a.currency) || 0) + 1);
          }
          let best = "USD";
          let max = -1;
          for (const [k, v] of freq) {
            if (v > max) {
              max = v;
              best = k;
            }
          }
          setGlobalCurrency(best as Currency);
        } else {
          setGlobalCurrency("USD");
        }
      } catch (err) {
        console.warn("[ViewTab] fetch error:", err);
        if (alive) {
          setEntries([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // -------------------- FILTRAGE --------------------
  const filtered = useMemo(() => {
    const f = filters;
    return entries.filter((e) => {
      const d = e.date || d10(e.createdAt);
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
      if (f.accountId && e.accountId !== f.accountId) return false;
      if (f.marketId && e.marketId !== f.marketId) return false;
      if (f.strategyId && e.strategyId !== f.strategyId) return false;
      if (f.order && e.order !== f.order) return false;
      if (f.result && e.result !== f.result) return false;
      if (f.respect && e.respect !== f.respect) return false;
      if (f.session && e.session !== f.session) return false;
      return true;
    });
  }, [entries, filters]);

  // -------------------- KPI --------------------
  const kpi = useMemo(() => {
    let pnl = 0;
    let invested = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;

    for (const e of filtered) {
      const m = n2(e.resultMoney);
      const inv = n2(e.invested);
      if (Number.isFinite(inv)) invested += inv;
      if (Number.isFinite(m)) pnl += m;

      if (e.result === "Gain") wins++;
      else if (e.result === "Perte") losses++;
      else if (e.result === "Nul") ties++;
    }

    const total = wins + losses + ties;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { pnl, invested, wins, losses, ties, total, winRate };
  }, [filtered]);

  // -------------------- DATA GRAPHIQUES --------------------
  const chartsData = useMemo(() => {
    // 1. equtiy / PnL cumulé par date
    const byDate = new Map<string, number>();
    for (const e of filtered) {
      const d = e.date || d10(e.createdAt);
      const m = n2(e.resultMoney);
      byDate.set(d, (byDate.get(d) || 0) + (Number.isFinite(m) ? m : 0));
    }

    const equityPoints: Array<{ date: string; equity: number }> = [];
    let cum = 0;
    Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([date, v]) => {
        cum += v;
        equityPoints.push({ date, equity: cum });
      });

    // 2. Gains vs pertes (globaux)
    let gains = 0;
    let pertes = 0;
    for (const e of filtered) {
      const m = n2(e.resultMoney);
      if (!Number.isFinite(m)) continue;
      if (m >= 0) gains += m;
      else pertes += Math.abs(m);
    }
    const gainsLosses = [{ name: "Montants", Gains: gains, Pertes: pertes }];

    // 3. Buy / Sell
    let b = 0;
    let s = 0;
    for (const e of filtered) {
      if (e.order === "Buy") b++;
      else if (e.order === "Sell") s++;
    }
    const buySell = [
      { name: "Buy", value: b },
      { name: "Sell", value: s },
    ];

    // 4. PnL par jour de semaine
    const labs = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const acc = new Array(7).fill(0) as number[];
    for (const e of filtered) {
      const dt = new Date(e.date || e.createdAt);
      const idx = dt.getDay();
      const m = n2(e.resultMoney);
      acc[idx] += Number.isFinite(m) ? m : 0;
    }
    const byWeekday = labs.map((name, i) => ({ name, PnL: acc[i] }));

    // 5. discipline
    let ok = 0;
    let ko = 0;
    for (const e of filtered) {
      if (e.respect === "Oui") ok++;
      else if (e.respect === "Non") ko++;
    }
    const discipline = [
      { name: "Respectée", value: ok },
      { name: "Non respectée", value: ko },
    ];

    // 6. Gains / Pertes par marché
    const marketNameById = new Map<string, string>();
    for (const m of markets) {
      if (m.id) {
        marketNameById.set(m.id, m.name);
      }
    }
    const aggMarket = new Map<
      string,
      { name: string; Gains: number; Pertes: number }
    >();
    for (const e of filtered) {
      const m = n2(e.resultMoney);
      if (!Number.isFinite(m)) continue;
      const id = e.marketId || "";
      const name = marketNameById.get(id) || (id ? id : "Autres marchés");
      let rec = aggMarket.get(name);
      if (!rec) {
        rec = { name, Gains: 0, Pertes: 0 };
        aggMarket.set(name, rec);
      }
      if (m >= 0) rec.Gains += m;
      else rec.Pertes += Math.abs(m);
    }
    const byMarket = Array.from(aggMarket.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );

    // 7. Gains / Pertes par stratégie
    const stratNameById = new Map<string, string>();
    for (const s of strategies) {
      if (s.id) {
        stratNameById.set(s.id, s.name);
      }
    }
    const aggStrat = new Map<
      string,
      { name: string; Gains: number; Pertes: number }
    >();
    for (const e of filtered) {
      const m = n2(e.resultMoney);
      if (!Number.isFinite(m)) continue;
      const id = e.strategyId || "";
      const name = stratNameById.get(id) || (id ? id : "Sans stratégie");
      let rec = aggStrat.get(name);
      if (!rec) {
        rec = { name, Gains: 0, Pertes: 0 };
        aggStrat.set(name, rec);
      }
      if (m >= 0) rec.Gains += m;
      else rec.Pertes += Math.abs(m);
    }
    const byStrategy = Array.from(aggStrat.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );

    return {
      equityPoints,
      gainsLosses,
      buySell,
      byWeekday,
      discipline,
      byMarket,
      byStrategy,
    };
  }, [filtered, markets, strategies]);

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        accountOptions={accounts}
        marketOptions={markets}
        strategyOptions={strategies}
      />

      <KpiGrid kpi={kpi} currencySign={currencySign(globalCurrency)} />

      <ChartsGrid
        data={chartsData}
        currencySign={currencySign(globalCurrency)}
      />

      {loading && <div className="text-sm text-slate-500">Chargement…</div>}
    </div>
  );
}
