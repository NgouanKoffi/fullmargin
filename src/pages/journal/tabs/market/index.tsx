// src/pages/journal/tabs/market/index.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CandlestickChart, Plus, Download, Search } from "lucide-react";

import {
  listMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
  listJournal,
  listJournalAccounts,
} from "../../api";
import type { JournalEntry, Currency } from "../../types";
import { findCurrency } from "../../types";

// 👇 on a besoin de fmtMoney ici
import { fmtMoney } from "../../utils";

// 👇 on récupère le vrai type de stats
import { buildStatsByMarket, type MarketStats } from "./stats";

import MarketForm from "./MarketForm";
import MarketCard from "./MarketCard";
import ConfirmDialog from "./ConfirmDialog";
import { exportMarketsPdf } from "./exportPdf";
import Dialog from "../accounts/components/Dialog";
import Sparkline from "../accounts/components/Sparkline";

type Market = { id: string; name: string; createdAt: string };

export default function MarketTab() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");

  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Market | null>(null);
  const [query, setQuery] = useState("");
  const [askDelete, setAskDelete] = useState<Market | null>(null);
  const [detailMarket, setDetailMarket] = useState<Market | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [marketsRes, journalRes, accountsRes] = await Promise.all([
          listMarkets({ limit: 200 }),
          listJournal({ limit: 2000 }),
          listJournalAccounts({ limit: 200 }),
        ]);

        if (!alive) return;

        setMarkets(
          marketsRes.items.map((m) => ({
            id: m.id,
            name: m.name,
            createdAt: m.createdAt || new Date().toISOString(),
          }))
        );

        setEntries(journalRes.items as unknown as JournalEntry[]);

        if (accountsRes.items.length > 0) {
          setDisplayCurrency(accountsRes.items[0].currency);
        } else {
          setDisplayCurrency("USD");
        }
      } catch (err) {
        console.warn("[MarketTab] erreur de chargement API:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const statsByMarket = useMemo(() => buildStatsByMarket(entries), [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter((m) => m.name.toLowerCase().includes(q));
  }, [markets, query]);

  function startCreate() {
    setEditing(null);
    setOpenForm(true);
  }
  function startEdit(m: Market) {
    setEditing(m);
    setOpenForm(true);
  }
  function closeForm() {
    setEditing(null);
    setOpenForm(false);
  }

  async function handleSubmitForm(payload: { name: string }) {
    if (editing) {
      try {
        await updateMarket(editing.id, { name: payload.name });
      } catch (err) {
        console.warn(
          "[MarketTab] update échoué, on met à jour l'état quand même",
          err
        );
      }
      setMarkets((prev) =>
        prev.map((m) =>
          m.id === editing.id ? { ...m, name: payload.name } : m
        )
      );
    } else {
      try {
        const { id } = await createMarket({ name: payload.name });
        setMarkets((prev) => [
          {
            id,
            name: payload.name,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.warn(
          "[MarketTab] create échoué, on crée un pseudo marché",
          err
        );
        setMarkets((prev) => [
          {
            id: "tmp-" + Date.now().toString(36),
            name: payload.name,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
    closeForm();
  }

  async function handleConfirmDelete() {
    if (!askDelete) return;
    const target = askDelete;
    try {
      await deleteMarket(target.id);
    } catch (err) {
      console.warn("[MarketTab] delete échoué, on retire quand même", err);
    }
    setMarkets((prev) => prev.filter((m) => m.id !== target.id));
    setAskDelete(null);
  }

  function handleExportPdf() {
    const cur = findCurrency(displayCurrency);
    exportMarketsPdf({
      markets: filtered,
      statsByMarket,
      currency: cur.symbol || cur.code,
      filterLabel: query.trim()
        ? `Filtre: “${query.trim()}”`
        : "Tous les marchés",
    });
  }

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="w-full space-y-4">
      {/* header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center bg-violet-600 text-white">
          <CandlestickChart className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">Marchés</h3>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Liste des actifs / marchés utilisés dans le journal, avec stats.
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-violet-600 text-white border-violet-600 hover:bg-violet-500"
        >
          <Plus className="w-4 h-4" /> Créer un marché
        </button>

        <button
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Download className="w-4 h-4" /> Exporter (PDF)
        </button>

        <div className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher un marché…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full pl-9 pr-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      {/* formulaire inline */}
      {openForm && (
        <div>
          <MarketForm
            editing={editing}
            onCancel={closeForm}
            onSubmit={handleSubmitForm}
          />
        </div>
      )}

      {/* liste */}
      {/* liste */}
      {loading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-6 text-sm">
          Chargement des marchés…
        </div>
      ) : (
        <div
          id="market-export-root"
          className="
      grid gap-4
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      2xl:grid-cols-5
    "
        >
          {filtered.map((m) => (
            <MarketCard
              key={m.id}
              market={m}
              stats={statsByMarket.get(m.id)}
              currency={displayCurrency}
              onShowDetails={() => setDetailMarket(m)}
              onEdit={() => startEdit(m)}
              onAskDelete={() => setAskDelete(m)}
            />
          ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-6 text-sm text-slate-700 dark:text-slate-200">
              Aucun marché ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* modals rendus dans le body */}
      {portalTarget &&
        createPortal(
          <>
            {/* modal détail */}
            <Dialog
              open={!!detailMarket}
              onClose={() => setDetailMarket(null)}
              title={
                detailMarket
                  ? `Détails — ${detailMarket.name}`
                  : "Détails du marché"
              }
            >
              {detailMarket ? (
                <MarketDetailBody
                  market={detailMarket}
                  stats={statsByMarket.get(detailMarket.id) || null}
                  currency={displayCurrency}
                />
              ) : null}
            </Dialog>

            {/* confirm delete */}
            <ConfirmDialog
              open={!!askDelete}
              title="Supprimer le marché ?"
              text={
                askDelete
                  ? `Cette action est irréversible. Le marché « ${askDelete.name} » sera supprimé.`
                  : ""
              }
              onCancel={() => setAskDelete(null)}
              onConfirm={handleConfirmDelete}
            />
          </>,
          portalTarget
        )}

      {/* overlay plein écran */}
      <style>{`
        .fm-dialog-overlay,
        .fixed[data-dialog-layer],
        [data-radix-dialog-overlay],
        .fm-overlay {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(15,23,42,.55) !important;
          backdrop-filter: blur(2px);
          z-index: 70;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .fm-dialog-content,
        [data-radix-dialog-content] {
          max-width: min(960px, 100vw - 2.5rem);
          width: 100%;
        }
        @media (max-width: 640px) {
          .fm-dialog-content,
          [data-radix-dialog-content] {
            margin-top: auto;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

/* --------- contenu du modal de détail --------- */
function MarketDetailBody({
  market,
  stats,
  currency,
}: {
  market: Market;
  stats: MarketStats | null;
  currency: Currency;
}) {
  const created = new Date(market.createdAt);
  const st: MarketStats = stats || {
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

  // on prépare les points pour le sparkline
  const points =
    st.series && st.series.length
      ? [
          { x: created.getTime() - 1, y: 0 },
          ...st.series.map((p) => ({ x: p.x, y: p.y })),
        ]
      : [{ x: created.getTime(), y: 0 }];

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 flex items-center gap-2">
        Créé le{" "}
        {created.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      {/* graphique */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
        <Sparkline points={points} height={160} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <DetailStat label="Trades" value={st.trades} />
        <DetailStat
          label="PnL net"
          value={fmtMoney(st.net, currency)}
          tone={st.net >= 0 ? "good" : "bad"}
        />
        <DetailStat label="Investi" value={fmtMoney(st.invested, currency)} />
        <DetailStat
          label="Max DD"
          value={fmtMoney(-st.dd, currency)}
          tone="bad"
        />
      </div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "good" | "bad";
}) {
  const base =
    tone === "good"
      ? "bg-emerald-50 dark:bg-emerald-900/10 ring-emerald-200/60 dark:ring-emerald-800/40 text-emerald-800 dark:text-emerald-100"
      : tone === "bad"
      ? "bg-rose-50 dark:bg-rose-900/10 ring-rose-200/60 dark:ring-rose-800/40 text-rose-800 dark:text-rose-100"
      : "bg-slate-50 dark:bg-slate-800/50 ring-slate-200/60 dark:ring-slate-700/50 text-slate-900 dark:text-slate-50";
  return (
    <div className={`rounded-xl ring-1 p-3 ${base}`}>
      <div className="text-[11px] uppercase tracking-wide font-semibold mb-1">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
