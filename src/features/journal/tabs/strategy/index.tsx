// src/pages/journal/tabs/strategy/index.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Target, Plus, Download, Search } from "lucide-react";
import {
  listStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  listJournal,
  listJournalAccounts,
} from "../../api";
import { type Currency, type JournalEntry, findCurrency } from "../../types";
import StrategyForm from "./StrategyForm";
import StrategyCard from "./StrategyCard";
import ConfirmDialog from "./ConfirmDialog";
import { buildStatsByStrategy, type StrategyStats } from "./stats";
import { exportStrategiesPdf } from "./exportPdf";
import Dialog from "../accounts/components/Dialog";
import Sparkline from "../accounts/components/Sparkline";

type Strategy = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export default function StrategyTab() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");

  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [query, setQuery] = useState("");
  const [askDelete, setAskDelete] = useState<Strategy | null>(null);
  const [detailStrategy, setDetailStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [strategiesRes, journalRes, accountsRes] = await Promise.all([
          listStrategies({ limit: 200 }),
          listJournal({ limit: 2000 }),
          listJournalAccounts({ limit: 200 }),
        ]);

        if (!alive) return;

        const normalized = strategiesRes.items.map((raw) => {
          const apiItem = raw as {
            id: string;
            name: string;
            createdAt?: string;
            description?: string;
          };
          return {
            id: apiItem.id,
            name: apiItem.name,
            description: apiItem.description ?? "",
            createdAt: apiItem.createdAt || new Date().toISOString(),
          } as Strategy;
        });
        setStrategies(normalized);

        setEntries(journalRes.items as unknown as JournalEntry[]);

        if (accountsRes.items.length > 0) {
          setDisplayCurrency(accountsRes.items[0].currency);
        } else {
          setDisplayCurrency("USD");
        }
      } catch (err) {
        console.warn("[StrategyTab] erreur chargement:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const statsByStrategy = useMemo(
    () => buildStatsByStrategy(entries),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return strategies;
    return strategies.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );
  }, [strategies, query]);

  function startCreate() {
    setEditing(null);
    setOpenForm(true);
  }
  function startEdit(s: Strategy) {
    setEditing(s);
    setOpenForm(true);
  }
  function closeForm() {
    setEditing(null);
    setOpenForm(false);
  }

  async function handleSubmitForm(payload: {
    name: string;
    description?: string;
  }) {
    if (editing) {
      try {
        await updateStrategy(editing.id, payload);
      } catch (err) {
        console.warn(
          "[StrategyTab] PATCH échoué, on met quand même à jour",
          err
        );
      }
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === editing.id
            ? {
                ...s,
                name: payload.name,
                description: payload.description ?? "",
              }
            : s
        )
      );
    } else {
      try {
        const { id } = await createStrategy(payload);
        setStrategies((prev) => [
          {
            id,
            name: payload.name,
            description: payload.description ?? "",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        console.warn("[StrategyTab] POST échoué", err);
        setStrategies((prev) => [
          {
            id: "tmp-" + Date.now().toString(36),
            name: payload.name,
            description: payload.description ?? "",
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
      await deleteStrategy(target.id);
    } catch (err) {
      console.warn("[StrategyTab] DELETE échoué, on retire quand même", err);
    }
    setStrategies((prev) => prev.filter((s) => s.id !== target.id));
    setAskDelete(null);
  }

  function handleExportPdf() {
    const cur = findCurrency(displayCurrency);
    exportStrategiesPdf({
      strategies: filtered,
      statsByStrategy,
      currency: cur.symbol || cur.code,
      filterLabel: query.trim()
        ? `Filtre: “${query.trim()}”`
        : "Toutes les stratégies",
    });
  }

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="w-full space-y-4">
      {/* Bandeau intro */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center bg-violet-600 text-white">
          <Target className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">Stratégies</h3>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Crée, modifie et analyse les perfs de chaque stratégie d’après le
            journal.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-violet-600 text-white border-violet-600 hover:bg-violet-500"
        >
          <Plus className="w-4 h-4" /> Créer une stratégie
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
            placeholder="Rechercher une stratégie…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full pl-9 pr-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      {/* Formulaire inline */}
      {openForm && (
        <div>
          <StrategyForm
            editing={editing}
            onCancel={closeForm}
            onSubmit={handleSubmitForm}
          />
        </div>
      )}

      {/* Liste responsive, même logique que Marchés */}
      {loading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-6 text-sm">
          Chargement des stratégies…
        </div>
      ) : (
        <div
          className="
            grid gap-4
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            2xl:grid-cols-5
          "
        >
          {filtered.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              stats={statsByStrategy.get(s.id)}
              currency={displayCurrency}
              onShowDetails={() => setDetailStrategy(s)}
              onEdit={() => startEdit(s)}
              onAskDelete={() => setAskDelete(s)}
            />
          ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-6 text-sm text-slate-700 dark:text-slate-200">
              Aucune stratégie ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* modals dans le body */}
      {portalTarget &&
        createPortal(
          <>
            <Dialog
              open={!!detailStrategy}
              onClose={() => setDetailStrategy(null)}
              title={
                detailStrategy
                  ? `Détails — ${detailStrategy.name}`
                  : "Détails de la stratégie"
              }
            >
              {detailStrategy ? (
                <StrategyDetailBody
                  strategy={detailStrategy}
                  stats={statsByStrategy.get(detailStrategy.id) || null}
                  currency={displayCurrency}
                />
              ) : null}
            </Dialog>

            <ConfirmDialog
              open={!!askDelete}
              title="Supprimer la stratégie ?"
              text={
                askDelete
                  ? `Cette action est irréversible. La stratégie « ${askDelete.name} » sera supprimée.`
                  : ""
              }
              onCancel={() => setAskDelete(null)}
              onConfirm={handleConfirmDelete}
            />
          </>,
          portalTarget
        )}

      {/* Overlay plein écran comme marché */}
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

/* ---------- modal détail ---------- */
function StrategyDetailBody({
  strategy,
  stats,
  currency,
}: {
  strategy: Strategy;
  stats: StrategyStats | null;
  currency: Currency;
}) {
  const created = new Date(strategy.createdAt);
  const st: StrategyStats = stats || {
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

  const cur = findCurrency(currency);
  const fm = (n: number) =>
    `${n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${cur.symbol || cur.code}`;

  const winrate =
    st.trades > 0 ? `${((st.wins / st.trades) * 100).toFixed(1)}%` : "0.0%";

  // points pour le petit graphique (comme marché)
  const points =
    st.series && st.series.length
      ? [
          { x: created.getTime() - 1, y: 0 },
          ...st.series.map((p) => ({ x: p.x, y: p.y })),
        ]
      : [{ x: created.getTime(), y: 0 }];

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        Créée le{" "}
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

      {strategy.description ? (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Description
          </div>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-100 whitespace-pre-wrap break-words">
            {strategy.description}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <DetailStat label="Trades" value={st.trades} />
        <DetailStat label="Win-rate" value={winrate} />
        <DetailStat label="Gain" value={fm(st.gain)} tone="good" />
        <DetailStat label="Perte" value={fm(-st.loss)} tone="bad" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DetailStat
          label="PnL net"
          value={fm(st.net)}
          tone={st.net >= 0 ? "good" : "bad"}
        />
        <DetailStat label="Investi total" value={fm(st.invested)} />
        <DetailStat label="Max drawdown" value={fm(-st.dd)} tone="bad" />
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
      ? "bg-emerald-50 dark:bg-emerald-900/10 ring-emerald-200/70 dark:ring-emerald-800/50 text-emerald-700 dark:text-emerald-200"
      : tone === "bad"
      ? "bg-rose-50 dark:bg-rose-900/10 ring-rose-200/70 dark:ring-rose-800/50 text-rose-700 dark:text-rose-200"
      : "bg-slate-50 dark:bg-slate-800/60 ring-slate-200/70 dark:ring-slate-700/50 text-slate-800 dark:text-slate-100";

  return (
    <div className={`rounded-xl ring-1 p-3 ${base}`}>
      <div className="text-[11px] uppercase tracking-wide font-semibold mb-1">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
