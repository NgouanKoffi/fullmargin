// src/pages/finance/ChartsTab/index.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import ChartCard from "./ChartCard";
import Filters from "./Filters";
import {
  fetchAccounts,
  fetchTransactions,
  materializeMonthly,
  loadGlobalCurrency,
} from "../core/storage";
import {
  type Account,
  type Currency,
  type Transaction,
  type TxDetail,
  type Recurrence,
} from "../core/types";

/* ===== Helpers dates ===== */
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function monthsBetween(a: Date, b: Date) {
  const res: Date[] = [];
  const d = new Date(a);
  d.setDate(1);
  while (d <= b) {
    res.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return res;
}

/* ===== Couleurs ===== */
const COLOR_INCOME = "#22c55e";
const COLOR_EXPENSE = "#ef4444";
const COLOR_NET = "#3b82f6";
const COLOR_BALANCE = "#6366f1";

/* ===== Types séries ===== */
type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  net: number;
};
type MonthlyBalancePoint = { month: string; balance: number };
type DetailDatum = { name: string; value: number };
type AccountFluxDatum = {
  name: string;
  income: number;
  expense: number;
  net: number;
};

/* ===== Format monétaire global (comme chez toi) ===== */
type IntlInfo = { icu: string; locale: string; frac: number };
const DEFAULT_INTL: IntlInfo = { icu: "XOF", locale: "fr-FR", frac: 2 };

function getIntlInfo(cur: Currency): IntlInfo {
  switch (cur as string) {
    case "USD":
      return { icu: "USD", locale: "en-US", frac: 2 };
    case "EUR":
      return { icu: "EUR", locale: "fr-FR", frac: 2 };
    case "GBP":
      return { icu: "GBP", locale: "en-GB", frac: 2 };
    case "JPY":
      return { icu: "JPY", locale: "ja-JP", frac: 0 };
    case "CAD":
      return { icu: "CAD", locale: "en-CA", frac: 2 };
    case "AUD":
      return { icu: "AUD", locale: "en-AU", frac: 2 };
    case "CNY":
      return { icu: "CNY", locale: "zh-CN", frac: 2 };
    case "CHF":
      return { icu: "CHF", locale: "fr-CH", frac: 2 };
    case "NGN":
      return { icu: "NGN", locale: "en-NG", frac: 2 };
    case "ZAR":
      return { icu: "ZAR", locale: "en-ZA", frac: 2 };
    case "MAD":
      return { icu: "MAD", locale: "fr-MA", frac: 2 };
    case "INR":
      return { icu: "INR", locale: "en-IN", frac: 2 };
    case "AED":
      return { icu: "AED", locale: "ar-AE", frac: 2 };
    case "BTC":
      return { icu: "BTC", locale: "en-US", frac: 8 };
    case "ETH":
      return { icu: "ETH", locale: "en-US", frac: 8 };
    case "BNB":
      return { icu: "BNB", locale: "en-US", frac: 8 };
    case "USDT":
      return { icu: "USD", locale: "en-US", frac: 2 };
    case "XAF":
      return { icu: "XAF", locale: "fr-FR", frac: 0 };
    case "XOF":
    case "FCFA":
      return { icu: "XOF", locale: "fr-FR", frac: 0 };
    case "GHS":
      return { icu: "GHS", locale: "en-GH", frac: 2 };
    case "KES":
      return { icu: "KES", locale: "en-KE", frac: 2 };
    default:
      return DEFAULT_INTL;
  }
}

/* ===== Formatter court pour l’AXE Y seulement ===== */
function shortNumber(n: number) {
  const v = Math.abs(n);
  if (v >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (v >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ChartsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txsRaw, setTxsRaw] = useState<Transaction[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState<Currency>("XOF");
  const [loading, setLoading] = useState(true);

  // chargement initial → on lit la devise globale
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cur, accs, txs] = await Promise.all([
          loadGlobalCurrency(),
          fetchAccounts(),
          fetchTransactions(),
        ]);
        if (!mounted) return;
        setGlobalCurrency(cur);
        setAccounts(accs);
        setTxsRaw(materializeMonthly(txs));
      } catch (err) {
        console.error("Finance charts load error:", err);
        if (!mounted) return;
        setAccounts([]);
        setTxsRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // le vrai formatter qui dépend de TA devise
  const intl = getIntlInfo(globalCurrency);
  const numberFmt = new Intl.NumberFormat(intl.locale, {
    style: "currency",
    currency: intl.icu,
    maximumFractionDigits: intl.frac,
  });
  const moneyTick = (n: number) => numberFmt.format(Number(n) || 0);

  // ✅ version protégée : si ce n’est pas "YYYY-MM", on affiche "—"
  const ymLabel = (ym: string) => {
    if (!/^\d{4}-\d{2}$/.test(ym)) return "—";
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y || 1970, (m || 1) - 1, 1);
    return d.toLocaleDateString(intl.locale, {
      month: "short",
      year: "2-digit",
    });
  };

  /* ===== filtres ===== */
  const [q, setQ] = useState("");
  const [acc, setAcc] = useState("");
  const [type, setType] = useState<"" | "income" | "expense">("");
  const [detail, setDetail] = useState<"" | TxDetail>("");
  const [rec, setRec] = useState<"" | Recurrence>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const accById = useMemo(() => {
    const m = new Map<string, Account>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  /* ---------- filtrage transactions ---------- */
  const tx = useMemo(() => {
    const s = q.trim().toLowerCase();

    return txsRaw
      .filter((t) => {
        // filtres simples
        if (acc && t.accountId !== acc) return false;
        if (type && t.type !== type) return false;
        if (detail && t.detail !== detail) return false;
        if (rec && t.recurrence !== rec) return false;

        // ✅ on compare en string yyyy-mm-dd comme les inputs
        const txDay = t.date.slice(0, 10);
        if (fromDate && txDay < fromDate) return false;
        if (toDate && txDay > toDate) return false;

        if (!s) return true;
        const a = accById.get(t.accountId);
        const hay = [
          a?.name ?? "",
          t.detail,
          t.comment ?? "",
          t.type,
          String(t.amount),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [txsRaw, acc, type, detail, rec, fromDate, toDate, q, accById]);

  /* ---------- métriques top ---------- */
  const topMetrics = useMemo(() => {
    let inc = 0,
      exp = 0;
    for (const t of tx) {
      const a = Math.abs(t.amount) || 0;
      if (t.type === "income") inc += a;
      else exp += a;
    }
    const initial = accounts
      .filter((a) => !acc || a.id === acc)
      .reduce((s, a) => s + (Number(a.initial) || 0), 0);
    const balance = initial + inc - exp;
    return { inc, exp, balance, initial };
  }, [tx, accounts, acc]);

  /* ---------- séries mensuelles ---------- */
  const monthly = useMemo<{
    points: MonthlyPoint[];
    balance: MonthlyBalancePoint[];
  }>(() => {
    if (tx.length === 0) return { points: [], balance: [] };

    // bornes selon les filtres si présents
    const minD = fromDate
      ? startOfMonth(new Date(fromDate + "T00:00:00"))
      : startOfMonth(new Date(tx[0].date));
    const maxD = toDate
      ? endOfMonth(new Date(toDate + "T23:59:59"))
      : endOfMonth(new Date(tx[tx.length - 1].date));

    const months = monthsBetween(minD, maxD);

    const byYM = new Map<
      string,
      { ym: string; income: number; expense: number }
    >();
    months.forEach((d) =>
      byYM.set(d.toISOString().slice(0, 7), {
        ym: d.toISOString().slice(0, 7),
        income: 0,
        expense: 0,
      })
    );

    for (const t of tx) {
      const key = t.date.slice(0, 7);
      const row = byYM.get(key);
      if (!row) continue;
      const amt = Math.abs(t.amount) || 0;
      if (t.type === "income") row.income += amt;
      else row.expense += amt;
    }

    const points: MonthlyPoint[] = Array.from(byYM.values()).map((r) => ({
      month: r.ym,
      income: r.income,
      expense: r.expense,
      net: r.income - r.expense,
    }));

    let running = topMetrics.initial;
    const balance: MonthlyBalancePoint[] = points.map((p) => {
      running += p.income - p.expense;
      return { month: p.month, balance: running };
    });

    return { points, balance };
  }, [tx, topMetrics.initial, fromDate, toDate]);

  /* ---------- répartition par détail ---------- */
  const byDetail = useMemo<DetailDatum[]>(() => {
    const map = new Map<string, number>();
    for (const t of tx) {
      const k = t.detail || "autre";
      map.set(k, (map.get(k) || 0) + Math.abs(t.amount || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tx]);

  /* ---------- par compte ---------- */
  const byAccount = useMemo<AccountFluxDatum[]>(() => {
    const map = new Map<
      string,
      { name: string; income: number; expense: number }
    >();
    for (const t of tx) {
      const a = accById.get(t.accountId);
      if (!a) continue;
      const cur = map.get(t.accountId) || {
        name: a.name,
        income: 0,
        expense: 0,
      };
      const amt = Math.abs(t.amount) || 0;
      if (t.type === "income") cur.income += amt;
      else cur.expense += amt;
      map.set(t.accountId, cur);
    }
    return Array.from(map.values()).map((v) => ({
      ...v,
      net: v.income - v.expense,
    }));
  }, [tx, accById]);

  return (
    <section className="space-y-4">
      <Filters
        accounts={accounts}
        q={q}
        setQ={setQ}
        acc={acc}
        setAcc={setAcc}
        type={type}
        setType={setType}
        detail={detail}
        setDetail={setDetail}
        rec={rec}
        setRec={setRec}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
      />

      {loading ? (
        <div className="rounded-2xl p-8 text-center ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60">
          <p className="text-slate-600 dark:text-slate-300">
            Chargement des données financières...
          </p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4 ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Solde initial
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {moneyTick(topMetrics.initial)}
              </div>
            </div>
            <div className="rounded-2xl p-4 ring-1 ring-emerald-200/70 dark:ring-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Total gains
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {moneyTick(topMetrics.inc)}
              </div>
            </div>
            <div className="rounded-2xl p-4 ring-1 ring-rose-200/70 dark:ring-rose-800/50 bg-rose-50 dark:bg-rose-900/10">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                Total dépenses
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                {moneyTick(topMetrics.exp)}
              </div>
            </div>
            <div className="rounded-2xl p-4 ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Solde actuel
              </div>
              <div
                className={`mt-1 text-xl font-semibold tabular-nums ${
                  topMetrics.balance < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {moneyTick(topMetrics.balance)}
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Revenus / Dépenses / Net */}
            <ChartCard
              title="Revenus & Dépenses par mois"
              subtitle="Barres + net mensuel"
            >
              <ResponsiveContainer>
                <ComposedChart
                  data={
                    monthly.points.length
                      ? monthly.points
                      : [{ month: "—", income: 0, expense: 0, net: 0 }]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={ymLabel} />
                  <YAxis width={52} tickFormatter={shortNumber} />
                  <Tooltip
                    labelFormatter={ymLabel}
                    formatter={(v, n) => [moneyTick(Number(v)), n as string]}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Revenus"
                    fill={COLOR_INCOME}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Dépenses"
                    fill={COLOR_EXPENSE}
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net"
                    stroke={COLOR_NET}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Solde cumulé */}
            <ChartCard
              title="Solde cumulé"
              subtitle="Solde initial + flux mensuels"
            >
              <ResponsiveContainer>
                <AreaChart
                  data={
                    monthly.balance.length
                      ? monthly.balance
                      : [{ month: "—", balance: 0 }]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={ymLabel} />
                  <YAxis width={52} tickFormatter={shortNumber} />
                  <Tooltip
                    labelFormatter={ymLabel}
                    formatter={(v, n) => [moneyTick(Number(v)), n as string]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Solde"
                    stroke={COLOR_BALANCE}
                    fill={COLOR_BALANCE}
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Par catégorie */}
            <ChartCard
              title="Répartition par catégorie (détail)"
              subtitle="Valeur totale par catégorie"
            >
              <ResponsiveContainer>
                <BarChart
                  data={byDetail.length ? byDetail : [{ name: "—", value: 0 }]}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis width={52} tickFormatter={shortNumber} />
                  <Tooltip
                    formatter={(v, n) => [moneyTick(Number(v)), n as string]}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Montant"
                    fill={COLOR_NET}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Par compte */}
            <ChartCard
              title="Flux par compte"
              subtitle="Revenus, Dépenses et Net par compte"
            >
              <ResponsiveContainer>
                <BarChart
                  data={
                    byAccount.length
                      ? byAccount
                      : [{ name: "—", income: 0, expense: 0, net: 0 }]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis width={52} tickFormatter={shortNumber} />
                  <Tooltip
                    formatter={(v, n) => [moneyTick(Number(v)), n as string]}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Revenus"
                    fill={COLOR_INCOME}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Dépenses"
                    fill={COLOR_EXPENSE}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="net"
                    name="Net"
                    fill={COLOR_NET}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {tx.length === 0 && (
            <div className="rounded-2xl p-8 text-center ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60">
              <p className="text-slate-600 dark:text-slate-300">
                Aucune transaction ne correspond à vos filtres.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
