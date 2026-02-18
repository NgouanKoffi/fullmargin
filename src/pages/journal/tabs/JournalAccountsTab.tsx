// src/pages/journal/tabs/JournalAccountsTab.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Wallet2,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  Info,
  AlignLeft,
  ChevronRight,
} from "lucide-react";

import type { JournalEntry, Currency } from "../types";
import { fmtMoney, cx, n2 } from "../utils";

import exportAccountsPDF from "./accounts/pdf/exportAccountsPDF";
import Dialog from "./accounts/components/Dialog";
import Confirm from "./accounts/components/Confirm";
import AccountForm from "./accounts/components/AccountForm";
import Sparkline from "./accounts/components/Sparkline";
import ActionBar from "./accounts/ActionBar";

// API
import {
  listJournalAccounts,
  createJournalAccount,
  updateJournalAccount,
  deleteJournalAccount,
  setAllJournalAccountsCurrency,
  listJournal,
  type JournalAccountDoc,
} from "../api";

type Account = JournalAccountDoc;

export default function JournalAccountsTab() {
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // filtres
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // modals
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [askDelete, setAskDelete] = useState<Account | null>(null);
  const [detailAcc, setDetailAcc] = useState<Account | null>(null);

  // devise globale
  const [globalCurrency, setGlobalCurrency] = useState<Currency>("USD");
  const [busyGlobal, setBusyGlobal] = useState(false);

  // entrées
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  /* ------------------ chargement ------------------ */
  async function refreshAccounts() {
    setLoading(true);
    try {
      const { items: rows } = await listJournalAccounts({ limit: 200 });
      setItems(rows);
      if (rows.length > 0) setGlobalCurrency(rows[0].currency as Currency);
    } catch (err) {
      console.warn("[Journal] Chargement comptes échoué :", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshEntries() {
    try {
      const { items: raw } = await listJournal({ limit: 500 });
      const mapped: JournalEntry[] = raw.map((r) => ({
        id: r.id,
        accountId: r.accountId || "",
        accountName: r.accountName || "",
        marketId: "",
        marketName: "",
        strategyId: "",
        strategyName: "",
        order: "",
        lot: "",
        result: r.result || "",
        detail: "",
        invested: "0",
        resultMoney: r.resultMoney || "0",
        resultPct: r.resultPct || "",
        respect: "",
        duration: "",
        timeframes: [],
        session: "",
        comment: "",
        imageDataUrl: "",
        imageUrl: undefined,
        date: r.date || "",
        createdAt: r.date || r.updatedAt || new Date().toISOString(),
      }));
      setEntries(mapped);
    } catch (err) {
      console.warn("[Journal] Chargement entrées échoué :", err);
      setEntries([]);
    }
  }

  useEffect(() => {
    void refreshAccounts();
    void refreshEntries();
  }, []);

  /* ------------------ filtrage ------------------ */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromD = from
      ? new Date(from + "T00:00:00.000Z").getTime()
      : -Infinity;
    const toD = to ? new Date(to + "T23:59:59.999Z").getTime() : Infinity;

    return items.filter((a) => {
      const t = new Date(a.createdAt).getTime();
      if (!(t >= fromD && t <= toD)) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.currency as string).toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
      );
    });
  }, [items, query, from, to]);

  /* ------------------ stats ------------------ */
  type Stat = {
    invested: number;
    gain: number;
    loss: number;
    net: number;
    trades: number;
    wins: number;
    breakeven: number;
    series: Array<{ x: number; y: number }>;
  };

  const statsByAcc = useMemo(() => {
    const map = new Map<string, Stat>();

    const fromD = from
      ? new Date(from + "T00:00:00.000Z").getTime()
      : -Infinity;
    const toD = to ? new Date(to + "T23:59:59.999Z").getTime() : Infinity;

    const knownIds = new Set(items.map((a) => a.id));
    const nameToId = new Map(
      items.map((a) => [a.name.trim().toLowerCase(), a.id] as const)
    );
    const byAcc = new Map<string, JournalEntry[]>();

    for (const e of entries) {
      const t = new Date(e.date || e.createdAt).getTime();
      if (!(t >= fromD && t <= toD)) continue;

      let key: string | undefined;
      if (e.accountId && knownIds.has(e.accountId)) {
        key = e.accountId;
      } else {
        const viaName = nameToId.get(
          String(e.accountName || "")
            .trim()
            .toLowerCase()
        );
        if (viaName) key = viaName;
      }
      if (!key) continue;
      if (!byAcc.has(key)) byAcc.set(key, []);
      byAcc.get(key)!.push(e);
    }

    for (const [accId, arr] of byAcc.entries()) {
      arr.sort((a, b) =>
        (a.date || a.createdAt).localeCompare(b.date || b.createdAt)
      );

      const s: Stat = {
        invested: 0,
        gain: 0,
        loss: 0,
        net: 0,
        trades: 0,
        wins: 0,
        breakeven: 0,
        series: [],
      };
      let cum = 0;

      for (const e of arr) {
        const inv = n2(e.invested);
        const pnl = n2(e.resultMoney);

        s.invested += Number.isFinite(inv) ? inv : 0;
        if (Number.isFinite(pnl)) {
          if (pnl > 0) s.gain += pnl;
          else if (pnl < 0) s.loss += Math.abs(pnl);
        }

        s.trades += 1;
        if (e.result === "Gain") s.wins += 1;
        if (e.result === "Nul") s.breakeven += 1;

        cum += Number.isFinite(pnl) ? pnl : 0;
        s.series.push({
          x: new Date(e.date || e.createdAt).getTime(),
          y: cum,
        });
      }

      s.net = s.gain - s.loss;
      map.set(accId, s);
    }

    return map;
  }, [entries, items, from, to]);

  /* ------------------ CRUD (corrigé) ------------------ */
  async function saveAccount(
    payload: Partial<Account> & {
      name: string;
      initial: number;
      description?: string;
      currency?: Currency;
    }
  ) {
    const isEdit = !!payload.id;

    try {
      if (isEdit) {
        await updateJournalAccount(payload.id!, {
          name: payload.name,
          initial: payload.initial,
          description: payload.description,
          ...(payload.currency ? { currency: payload.currency } : {}),
        });
      } else {
        await createJournalAccount({
          name: payload.name,
          initial: payload.initial,
          description: payload.description,
          currency: payload.currency ?? globalCurrency,
        });
      }
    } catch (e) {
      console.warn("[Comptes] Sauvegarde échouée, fallback local :", e);
      setItems((prev) => {
        if (isEdit) {
          return prev.map((x) =>
            x.id === payload.id
              ? {
                  ...x,
                  name: payload.name,
                  initial: payload.initial,
                  description: payload.description,
                  ...(payload.currency ? { currency: payload.currency } : {}),
                }
              : x
          );
        }
        const created: Account = {
          id: `${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 10)}`,
          name: payload.name,
          initial: payload.initial,
          description: payload.description || "",
          currency: payload.currency ?? globalCurrency,
          createdAt: new Date().toISOString(),
        };
        return [created, ...prev];
      });
      alert("Serveur indisponible : modification appliquée localement.");
      setOpenForm(false);
      setEditing(null);
      return;
    }

    // succès
    setOpenForm(false);
    setEditing(null);

    try {
      await refreshAccounts();
      await refreshEntries();
    } catch (e) {
      console.warn("[Comptes] refresh après save KO :", e);
    }
  }

  async function confirmDelete() {
    if (!askDelete) return;
    try {
      await deleteJournalAccount(askDelete.id);
      await refreshAccounts();
      setAskDelete(null);
    } catch (e) {
      console.warn("[Comptes] Suppression échouée, fallback local :", e);
      setItems((prev) => prev.filter((x) => x.id !== askDelete.id));
      setAskDelete(null);
      alert("Serveur indisponible : suppression appliquée localement.");
    }
  }

  async function applyGlobalCurrency(cur: Currency) {
    if (!items.length) return;
    setBusyGlobal(true);
    try {
      let bulkOk = false;
      try {
        const r = await setAllJournalAccountsCurrency(cur);
        bulkOk = !!(r && typeof r.updated === "number");
      } catch {
        bulkOk = false;
      }

      if (!bulkOk) {
        await Promise.allSettled(
          items.map((acc) =>
            updateJournalAccount(acc.id, {
              currency: cur,
            })
          )
        );
      }

      await refreshAccounts();
    } finally {
      setBusyGlobal(false);
    }
  }

  // petit helper pour porter dans le body
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <section className="space-y-4">
      {/* info */}
      <div className="flex items-start gap-2 rounded-xl border border-indigo-300/50 dark:border-indigo-700/50 bg-indigo-50/70 dark:bg-indigo-900/40 p-3 text-sm text-indigo-950 dark:text-indigo-100">
        <Info className="w-4 h-4 mt-0.5" />
        <p>
          Crée tes <b>comptes de journal</b> (Prop, Broker, Crypto, Démo…). Les
          stats et le graphique sont calculés à partir de tes <b>journaux</b>.
        </p>
      </div>

      {/* ✅ action bar (FILTRES FERMÉS PAR DÉFAUT) */}
      <ActionBar
        query={query}
        setQuery={setQuery}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        onCreate={() => {
          setEditing(null);
          setOpenForm(true);
        }}
        onExport={() =>
          exportAccountsPDF({
            filtered,
            statsByAcc,
            from,
            to,
            query,
          })
        }
        globalCurrency={globalCurrency}
        setGlobalCurrency={setGlobalCurrency}
        applyGlobalCurrency={applyGlobalCurrency}
        busyGlobal={busyGlobal}
        defaultOpen={false}
        storageKey="fm.journal.filters.open"
      />

      {/* LISTE */}
      {loading ? (
        <div className="rounded-xl border border-slate-200/50 dark:border-slate-800 p-6 text-sm">
          Chargement des comptes…
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => {
            const stat = statsByAcc.get(a.id);
            const currentBalance = a.initial + (stat ? stat.net : 0);

            const color =
              a.currency === "USD"
                ? "from-indigo-500 to-sky-500"
                : a.currency === "EUR"
                ? "from-emerald-500 to-lime-500"
                : "from-fuchsia-500 to-rose-500";

            return (
              <article
                key={a.id}
                className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

                {/* haut */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex gap-3 items-start">
                    <button
                      onClick={() => setDetailAcc(a)}
                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200/40 dark:border-slate-700/70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                      title="Voir le détail"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div
                      className={`h-10 w-10 flex-shrink-0 rounded-xl grid place-items-center text-white shadow-sm bg-gradient-to-br ${color}`}
                    >
                      <Wallet2 className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm leading-tight truncate">
                        {a.name}
                      </h4>
                      <p
                        className="text-[10px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-full"
                        title={`ID : ${a.id}`}
                      >
                        ID : {a.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* bas */}
                <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/10">
                    {stat ? stat.trades : 0} trades
                  </span>
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
                      currentBalance < 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-200 ring-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 ring-emerald-500/30"
                    )}
                  >
                    {fmtMoney(currentBalance, a.currency)}
                  </span>

                  <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setOpenForm(true);
                      }}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200/40 dark:border-slate-700/70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAskDelete(a)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-rose-200/60 text-rose-500 hover:bg-rose-500/10 dark:border-rose-800"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-sm text-slate-700 dark:text-slate-300">
              Aucun compte ne correspond à vos filtres.
            </div>
          )}
        </div>
      )}

      {/* modals via portal */}
      {portalTarget &&
        createPortal(
          <>
            <Dialog
              open={openForm}
              onClose={() => setOpenForm(false)}
              title={
                editing ? "Modifier le compte" : "Créer un compte de journal"
              }
            >
              <AccountForm
                initial={editing}
                defaultCurrency={globalCurrency}
                onSave={saveAccount}
                onCancel={() => setOpenForm(false)}
              />
            </Dialog>

            <Dialog
              open={!!detailAcc}
              onClose={() => setDetailAcc(null)}
              title={
                detailAcc ? `Détails — ${detailAcc.name}` : "Détails du compte"
              }
            >
              {detailAcc ? (
                <AccountDetailContent
                  acc={detailAcc}
                  stat={statsByAcc.get(detailAcc.id) || null}
                />
              ) : null}
            </Dialog>

            <Confirm
              open={!!askDelete}
              title="Supprimer le compte ?"
              text={`Cette action est irréversible. Toutes les données associées à « ${
                askDelete?.name ?? ""
              } » seront supprimées plus tard quand on reliera les transactions.`}
              onCancel={() => setAskDelete(null)}
              onConfirm={confirmDelete}
            />
          </>,
          portalTarget
        )}

      {/* overlay full screen */}
      <style>{`
        .fm-dialog-overlay,
        .fixed[data-dialog-layer],
        [data-radix-dialog-overlay],
        .fm-overlay {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(15,23,42,0.55) !important;
          backdrop-filter: blur(2px);
          z-index: 50;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .fm-dialog-content,
        [data-radix-dialog-content] {
          max-width: min(1024px, 100vw - 2.5rem);
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
    </section>
  );
}

/* ---------- détail dans le modal ---------- */
function AccountDetailContent({
  acc,
  stat,
}: {
  acc: Account;
  stat: {
    invested: number;
    gain: number;
    loss: number;
    net: number;
    trades: number;
    wins: number;
    breakeven: number;
    series: Array<{ x: number; y: number }>;
  } | null;
}) {
  const created = acc.createdAt ? new Date(acc.createdAt) : new Date();
  const points = stat
    ? [
        { x: created.getTime() - 1, y: acc.initial },
        ...stat.series.map((p) => ({ x: p.x, y: acc.initial + p.y })),
      ]
    : [{ x: created.getTime(), y: acc.initial }];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
        <Sparkline points={points} height={160} />
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <span className="text-lg font-semibold tabular-nums">
            {fmtMoney(acc.initial, acc.currency)}
          </span>
          <span className="text-slate-500 text-sm">· Solde initial</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 dark:text-slate-200">
            Créé le{" "}
            {created.toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
        <div className="flex items-start gap-2">
          <AlignLeft className="w-4 h-4 mt-0.5 text-slate-500" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Description
            </div>
            {acc.description ? (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                {acc.description}
              </p>
            ) : (
              <p className="mt-1 text-sm italic text-slate-400">
                Aucune description fournie.
              </p>
            )}
          </div>
        </div>
      </div>

      {stat ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200/70 dark:ring-slate-700/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Trades
            </div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {stat.trades}
            </div>
          </div>
          <div className="rounded-lg bg-rose-50 dark:bg-rose-900/10 ring-1 ring-rose-200/70 dark:ring-rose-800/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
              Perte
            </div>
            <div className="mt-1 text-base font-semibold tabular-nums text-rose-700 dark:text-rose-300">
              {fmtMoney(stat.loss, acc.currency)}
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-200/70 dark:ring-emerald-800/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Gain
            </div>
            <div className="mt-1 text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              {fmtMoney(stat.gain, acc.currency)}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200/70 dark:ring-slate-700/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Solde actuel
            </div>
            <div
              className={cx(
                "mt-1 text-base font-semibold tabular-nums",
                acc.initial + stat.net < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-300"
              )}
            >
              {fmtMoney(acc.initial + stat.net, acc.currency)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
