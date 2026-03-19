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
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Wallet, // <-- Ajouté pour l'historique global
} from "lucide-react";

import type { JournalEntry, Currency, AccountTransaction } from "../types";
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
  listAccountTransactions,
  createAccountTransaction,
  deleteAccountTransaction,
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
  const [openTxForm, setOpenTxForm] = useState<Account | null>(null);
  const [openHistory, setOpenHistory] = useState<boolean>(false); // <-- NOUVEAU STATUT HISTORIQUE GLOBAL

  // devise globale
  const [globalCurrency, setGlobalCurrency] = useState<Currency>("USD");
  const [busyGlobal, setBusyGlobal] = useState(false);

  // entrées et transactions
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);

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
        ...r,
        invested: r.invested || "0",
        resultMoney: r.resultMoney || "0",
      })) as any;
      setEntries(mapped);
    } catch (err) {
      setEntries([]);
    }
  }

  async function refreshTransactions() {
    try {
      const res = await listAccountTransactions();
      setTransactions(res.items || []);
    } catch (err) {
      setTransactions([]);
    }
  }

  useEffect(() => {
    void refreshAccounts();
    void refreshEntries();
    void refreshTransactions();
  }, []);

  /* ------------------ filtrage ------------------ */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromD = from ? new Date(from + "T00:00:00.000Z").getTime() : -Infinity;
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
    deposits: number;
    withdrawals: number;
    trades: number;
    wins: number;
    breakeven: number;
    series: Array<{ x: number; y: number }>;
  };

  const statsByAcc = useMemo(() => {
    const map = new Map<string, Stat>();

    const fromD = from ? new Date(from + "T00:00:00.000Z").getTime() : -Infinity;
    const toD = to ? new Date(to + "T23:59:59.999Z").getTime() : Infinity;

    const txByAcc = new Map<string, { dep: number; wit: number }>();
    for (const tx of transactions) {
      if (!txByAcc.has(tx.accountId)) txByAcc.set(tx.accountId, { dep: 0, wit: 0 });
      const entry = txByAcc.get(tx.accountId)!;
      if (tx.type === "deposit") entry.dep += tx.amount;
      if (tx.type === "withdrawal") entry.wit += tx.amount;
    }

    const knownIds = new Set(items.map((a) => a.id));
    const nameToId = new Map(items.map((a) => [a.name.trim().toLowerCase(), a.id] as const));
    const byAcc = new Map<string, JournalEntry[]>();

    for (const e of entries) {
      const t = new Date(e.date || e.createdAt).getTime();
      if (!(t >= fromD && t <= toD)) continue;

      let key: string | undefined;
      if (e.accountId && knownIds.has(e.accountId)) {
        key = e.accountId;
      } else {
        const viaName = nameToId.get(String(e.accountName || "").trim().toLowerCase());
        if (viaName) key = viaName;
      }
      if (!key) continue;
      if (!byAcc.has(key)) byAcc.set(key, []);
      byAcc.get(key)!.push(e);
    }

    for (const a of items) {
      const arr = byAcc.get(a.id) || [];
      const txData = txByAcc.get(a.id) || { dep: 0, wit: 0 };

      arr.sort((x, y) => (x.date || x.createdAt).localeCompare(y.date || y.createdAt));

      const s: Stat = {
        invested: 0, gain: 0, loss: 0, net: 0,
        deposits: txData.dep, withdrawals: txData.wit,
        trades: 0, wins: 0, breakeven: 0,
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
      map.set(a.id, s);
    }

    return map;
  }, [entries, transactions, items, from, to]);

  /* ------------------ CRUD Comptes & Transactions ------------------ */
  async function saveAccount(
    payload: Partial<Account> & { name: string; initial: number; description?: string; currency?: Currency },
  ) {
    const isEdit = !!payload.id;
    try {
      if (isEdit) {
        await updateJournalAccount(payload.id!, payload);
      } else {
        await createJournalAccount({ ...payload, currency: payload.currency ?? globalCurrency } as any);
      }
      setOpenForm(false);
      setEditing(null);
      void refreshAccounts();
      void refreshEntries();
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    }
  }

  async function confirmDelete() {
    if (!askDelete) return;
    try {
      await deleteJournalAccount(askDelete.id);
      await refreshAccounts();
      setAskDelete(null);
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  }

  async function handleDeleteTx(id: string) {
    if (!window.confirm("Voulez-vous vraiment annuler cette transaction ?")) return;
    try {
      await deleteAccountTransaction(id);
      await refreshTransactions();
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  }

  async function applyGlobalCurrency(cur: Currency) {
    if (!items.length) return;
    setBusyGlobal(true);
    try {
      await setAllJournalAccountsCurrency(cur);
      await refreshAccounts();
    } finally {
      setBusyGlobal(false);
    }
  }

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-indigo-300/50 dark:border-indigo-700/50 bg-indigo-50/70 dark:bg-indigo-900/40 p-3 text-sm text-indigo-950 dark:text-indigo-100">
        <Info className="w-4 h-4 mt-0.5" />
        <p>
          Crée tes <b>comptes de journal</b> (Prop, Broker, Crypto, Démo…). Les
          stats et le graphique sont calculés à partir de tes <b>journaux</b> et de tes <b>flux de capital</b>.
        </p>
      </div>

      {/* 👇 LIAISON AVEC LA BARRE D'ACTIONS */}
      <ActionBar
        query={query} setQuery={setQuery} from={from} setFrom={setFrom} to={to} setTo={setTo}
        onCreate={() => { setEditing(null); setOpenForm(true); }}
        onExport={() => exportAccountsPDF({ filtered, statsByAcc, from, to, query })}
        onOpenHistory={() => setOpenHistory(true)} // <-- OUVRE L'HISTORIQUE GLOBAL
        globalCurrency={globalCurrency} setGlobalCurrency={setGlobalCurrency}
        applyGlobalCurrency={applyGlobalCurrency} busyGlobal={busyGlobal}
        defaultOpen={false} storageKey="fm.journal.filters.open"
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200/50 dark:border-slate-800 p-6 text-sm">
          Chargement des comptes…
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => {
            const stat = statsByAcc.get(a.id);
            const currentBalance = a.initial + (stat?.net || 0) + (stat?.deposits || 0) - (stat?.withdrawals || 0);

            const color =
              a.currency === "USD" ? "from-indigo-500 to-sky-500"
                : a.currency === "EUR" ? "from-emerald-500 to-lime-500"
                : "from-fuchsia-500 to-rose-500";

            return (
              <article key={a.id} className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
                <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

                <div className="px-4 pt-3 pb-2">
                  <div className="flex gap-3 items-start">
                    <button
                      onClick={() => setDetailAcc(a)}
                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200/40 dark:border-slate-700/70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                      title="Voir le détail du compte"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className={`h-10 w-10 flex-shrink-0 rounded-xl grid place-items-center text-white shadow-sm bg-gradient-to-br ${color}`}>
                      <Wallet2 className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm leading-tight truncate">{a.name}</h4>
                      <p className="text-[10px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-full">
                        ID : {a.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/10">
                    {stat ? stat.trades : 0} trades
                  </span>
                  <span
                    className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
                      currentBalance < 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-200 ring-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 ring-emerald-500/30"
                    )}
                  >
                    {fmtMoney(currentBalance, a.currency)}
                  </span>

                  <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                    <button
                      onClick={() => setOpenTxForm(a)}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-violet-200/60 text-violet-600 text-xs font-medium hover:bg-violet-500/10 dark:border-violet-800/60 dark:text-violet-400 transition"
                      title="Dépôt / Retrait"
                    >
                      <ArrowDownUp className="w-3.5 h-3.5" />
                      Dépôt / Retrait
                    </button>
                    <button
                      onClick={() => { setEditing(a); setOpenForm(true); }}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200/40 dark:border-slate-700/70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAskDelete(a)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-rose-200/60 text-rose-500 hover:bg-rose-500/10 dark:border-rose-800 transition"
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

      {/* portals */}
      {portalTarget &&
        createPortal(
          <>
            <Dialog open={openForm} onClose={() => setOpenForm(false)} title={editing ? "Modifier le compte" : "Créer un compte"}>
              <AccountForm initial={editing} defaultCurrency={globalCurrency} onSave={saveAccount} onCancel={() => setOpenForm(false)} />
            </Dialog>

            <Dialog open={!!openTxForm} onClose={() => setOpenTxForm(null)} title="Transaction de capital">
              {openTxForm && (
                <TransactionForm
                  acc={openTxForm}
                  onSave={() => { setOpenTxForm(null); void refreshTransactions(); }}
                  onCancel={() => setOpenTxForm(null)}
                />
              )}
            </Dialog>

            {/* 👇 MODALE D'HISTORIQUE GLOBAL */}
            <Dialog open={openHistory} onClose={() => setOpenHistory(false)} title="Historique des flux de capital">
              <TransactionHistoryGlobal 
                transactions={transactions} 
                accounts={items} 
                onDeleteTx={handleDeleteTx} 
              />
            </Dialog>

            <Dialog open={!!detailAcc} onClose={() => setDetailAcc(null)} title={detailAcc ? `Détails — ${detailAcc.name}` : "Détails du compte"}>
              {detailAcc ? (
                <AccountDetailContent acc={detailAcc} stat={statsByAcc.get(detailAcc.id) || null} />
              ) : null}
            </Dialog>

            <Confirm
              open={!!askDelete} title="Supprimer le compte ?"
              text={`Cette action est irréversible. Toutes les données inscrites dans votre journal et qui sont associées à ce compte ( ${askDelete?.name ?? ""} ) seront supprimées aussi.`}
              onCancel={() => setAskDelete(null)} onConfirm={confirmDelete}
            />
          </>,
          portalTarget
        )}

      <style>{`
        .fm-dialog-overlay, .fixed[data-dialog-layer], [data-radix-dialog-overlay], .fm-overlay {
          position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
          background: rgba(15,23,42,0.55) !important; backdrop-filter: blur(2px); z-index: 50;
          display: flex; justify-content: center; align-items: center;
        }
        .fm-dialog-content, [data-radix-dialog-content] { max-width: min(1024px, 100vw - 2.5rem); width: 100%; max-height: 90vh; overflow-y: auto; }
        @media (max-width: 640px) {
          .fm-dialog-content, [data-radix-dialog-content] { margin-top: auto; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
        }
      `}</style>
    </section>
  );
}

/* ---------- Formulaire de Dépôt / Retrait ---------- */
function TransactionForm({ acc, onSave, onCancel }: { acc: Account; onSave: () => void; onCancel: () => void }) {
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert("Le montant doit être supérieur à 0");
    setBusy(true);
    try {
      await createAccountTransaction({ accountId: acc.id, type, amount: Number(amount), date, note });
      onSave();
    } catch (err) {
      alert("Erreur réseau lors de la transaction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className={cx("flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition", type === "deposit" ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20" : "dark:border-slate-700")}>
          <input type="radio" name="txType" checked={type === "deposit"} onChange={() => setType("deposit")} className="hidden" />
          <div className={cx("w-4 h-4 rounded-full border-2 flex items-center justify-center", type === "deposit" ? "border-emerald-500" : "border-slate-300")}><div className={cx("w-2 h-2 rounded-full", type === "deposit" ? "bg-emerald-500" : "bg-transparent")} /></div>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Dépôt</span>
        </label>
        <label className={cx("flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition", type === "withdrawal" ? "bg-rose-50 border-rose-500 dark:bg-rose-900/20" : "dark:border-slate-700")}>
          <input type="radio" name="txType" checked={type === "withdrawal"} onChange={() => setType("withdrawal")} className="hidden" />
          <div className={cx("w-4 h-4 rounded-full border-2 flex items-center justify-center", type === "withdrawal" ? "border-rose-500" : "border-slate-300")}><div className={cx("w-2 h-2 rounded-full", type === "withdrawal" ? "bg-rose-500" : "bg-transparent")} /></div>
          <span className="font-medium text-rose-600 dark:text-rose-400">Retrait</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Montant ({acc.currency})</label>
        <input type="number" step="any" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex: 500" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Date</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Note (optionnelle)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Ajout de capital..." className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Annuler</button>
        <button type="submit" disabled={busy} className="px-4 py-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-50">Enregistrer</button>
      </div>
    </form>
  );
}

/* ---------- NOUVEAU COMPOSANT : Historique Global ---------- */
function TransactionHistoryGlobal({ 
  transactions, 
  accounts, 
  onDeleteTx 
}: { 
  transactions: AccountTransaction[]; 
  accounts: Account[]; 
  onDeleteTx: (id: string) => void;
}) {
  // Trier toutes les transactions de la plus récente à la plus ancienne
  const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedTxs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        <ArrowDownUp className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>Aucun dépôt ou retrait n'a été enregistré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {sortedTxs.map(tx => {
        // Retrouver le compte associé pour afficher son nom et sa devise
        const acc = accounts.find(a => a.id === tx.accountId);
        const accName = acc ? acc.name : "Compte supprimé";
        const currency = acc ? acc.currency : "USD";

        return (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cx("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm", 
                tx.type === 'deposit' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400")}>
                {tx.type === 'deposit' ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  {tx.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                  <span className="text-slate-400 font-normal text-xs bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {new Date(tx.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <Wallet className="w-3 h-3" /> {accName}
                </div>
                {tx.note && <div className="text-xs text-slate-500 truncate mt-0.5" title={tx.note}>{tx.note}</div>}
              </div>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <span className={cx("font-bold text-base whitespace-nowrap", tx.type === 'deposit' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {tx.type === 'deposit' ? '+' : '-'}{fmtMoney(tx.amount, currency)}
              </span>
              <button 
                onClick={() => onDeleteTx(tx.id)} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition" 
                title="Supprimer cette transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Détails Modal (Classique, sans liste d'historique) ---------- */
function AccountDetailContent({ acc, stat }: { acc: Account; stat: any }) {
  const created = acc.createdAt ? new Date(acc.createdAt) : new Date();
  
  const points = stat ? [
    { x: created.getTime() - 1, y: acc.initial },
    ...stat.series.map((p: any) => ({ x: p.x, y: acc.initial + p.y + (stat.deposits || 0) - (stat.withdrawals || 0) })),
  ] : [{ x: created.getTime(), y: acc.initial }];

  const finalBalance = acc.initial + (stat?.net || 0) + (stat?.deposits || 0) - (stat?.withdrawals || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
        <Sparkline points={points} height={160} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3">
          <div className="text-slate-500 text-[11px] uppercase tracking-wide font-semibold mb-1">Solde initial</div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <span className="text-lg font-semibold tabular-nums">{fmtMoney(acc.initial, acc.currency)}</span>
          </div>
        </div>

        {stat && (
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200/70 dark:border-indigo-800/50 p-3">
            <div className="text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wide font-semibold mb-1">Perf. Trading</div>
            <div className={cx("text-lg font-semibold tabular-nums", stat.net < 0 ? "text-rose-600" : "text-emerald-600")}>
              {stat.net > 0 ? "+" : ""}{fmtMoney(stat.net, acc.currency)}
            </div>
          </div>
        )}
      </div>

      {stat && (stat.deposits > 0 || stat.withdrawals > 0) && (
        <div className="flex gap-4 p-3 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-xl">
          <div className="flex-1">
            <span className="text-[11px] uppercase tracking-wide text-emerald-600">Total Dépôts</span>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">+{fmtMoney(stat.deposits, acc.currency)}</div>
          </div>
          <div className="flex-1 border-l border-violet-200 dark:border-violet-800 pl-4">
            <span className="text-[11px] uppercase tracking-wide text-rose-600">Total Retraits</span>
            <div className="text-sm font-bold text-rose-700 dark:text-rose-400">-{fmtMoney(stat.withdrawals, acc.currency)}</div>
          </div>
        </div>
      )}

      {stat && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200/70 dark:ring-slate-700/50 p-4 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Solde actuel (Avec flux)</div>
          <div className={cx("mt-1 text-2xl font-bold tabular-nums", finalBalance < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300")}>
            {fmtMoney(finalBalance, acc.currency)}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 dark:text-slate-200">
            Créé le {created.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
        <div className="flex items-start gap-2">
          <AlignLeft className="w-4 h-4 mt-0.5 text-slate-500" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</div>
            {acc.description ? (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{acc.description}</p>
            ) : (
              <p className="mt-1 text-sm italic text-slate-400">Aucune description fournie.</p>
            )}
          </div>
        </div>
      </div>

      {stat ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200/70 dark:ring-slate-700/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Trades</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{stat.trades}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}