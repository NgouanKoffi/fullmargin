// src/pages/finance/ActionTab/index.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import CardTx from "./CardTx";
import TxForm from "./TxForm";
import { Confirm } from "./ui";

import {
  materializeMonthly,
  fetchAccounts,
  fetchTransactions,
  createTransaction as createTx,
  patchTransaction as updateTx,
  removeTransaction as deleteTx,
  loadGlobalCurrency,
} from "../core/storage";
import {
  fmtMoney,
  type Account,
  type Currency,
  type Recurrence,
  type Transaction,
  type TxType,
  type TxDetail,
} from "../core/types";

/* ================= PDF helpers ================= */
function escapeHtml(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =======================================================
   Composant
======================================================= */
export default function ActionTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // devise globale
  const [globalCur, setGlobalCur] = useState<Currency>("XOF");

  // Filtres
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | TxType>("");
  const [accFilter, setAccFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // afficher / masquer le bloc de filtres
  const [filtersOpen, setFiltersOpen] = useState(false); // ✅ Fermé par défaut pour cohérence

  // onglet affiché
  const [activeTab, setActiveTab] = useState<"byAccount" | "all">("byAccount");

  // CRUD
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [askDelete, setAskDelete] = useState<Transaction | null>(null);

  // Collapse par section (clé = accountId)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  // Init
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [accs, txx, gcur] = await Promise.all([
          fetchAccounts(),
          fetchTransactions(),
          loadGlobalCurrency(),
        ]);
        if (!mounted) return;
        setAccounts(accs);
        setTx(materializeMonthly(txx));
        setGlobalCur(gcur);
      } catch (e) {
        console.error("finance/actionTab init error:", e);
        if (!mounted) return;
        setAccounts([]);
        setTx([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Acc map
  const accById = useMemo(() => {
    const m = new Map<string, Account>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  // Filtrage
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fromTs = fromDate
      ? new Date(fromDate + "T00:00:00").getTime()
      : -Infinity;
    const toTs = toDate
      ? new Date(toDate + "T23:59:59.999").getTime()
      : +Infinity;
    return tx
      .filter((t) => {
        if (typeFilter && t.type !== typeFilter) return false;
        if (accFilter && t.accountId !== accFilter) return false;
        const tts = new Date(t.date).getTime();
        if (tts < fromTs || tts > toTs) return false;
        if (!s) return true;
        const acc = accById.get(t.accountId);
        const hay = [
          acc?.name ?? "",
          t.detail,
          t.comment ?? "",
          t.type,
          new Date(t.date).toLocaleDateString("fr-FR"),
          String(t.amount),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(s);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tx, q, typeFilter, accFilter, fromDate, toDate, accById]);

  // Groupes par compte (utilisé uniquement dans l’onglet "par compte")
  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!m.has(t.accountId)) m.set(t.accountId, []);
      m.get(t.accountId)!.push(t);
    }
    return Array.from(m.entries()).sort((a, b) => {
      const an = accById.get(a[0])?.name || "";
      const bn = accById.get(b[0])?.name || "";
      return an.localeCompare(bn, "fr");
    });
  }, [filtered, accById]);

  /* ----------------- CRUD actions ----------------- */
  async function createOne(payload: {
    accountId: string;
    type: TxType;
    amount: number;
    date: string;
    recurrence: Recurrence;
    detail: TxDetail;
    comment?: string;
  }) {
    const iso = new Date(payload.date).toISOString();
    const res = await createTx({
      accountId: payload.accountId,
      type: payload.type,
      amount: payload.amount,
      date: iso,
      recurrence: payload.recurrence,
      detail: payload.detail,
      comment: (payload.comment || "").trim(),
    });
    const created: Transaction = {
      id: res.id,
      createdAt: new Date().toISOString(),
      parentId: undefined,
      accountId: payload.accountId,
      type: payload.type,
      amount: payload.amount,
      date: iso,
      recurrence: payload.recurrence,
      detail: payload.detail,
      comment: (payload.comment || "").trim(),
    };
    const next = materializeMonthly([created, ...tx]);
    setTx(next);
    setOpenForm(false);
  }

  async function updateOne(
    current: Transaction,
    payload: {
      accountId: string;
      type: TxType;
      amount: number;
      date: string;
      recurrence: Recurrence;
      detail: TxDetail;
      comment?: string;
    }
  ) {
    if (current.parentId) {
      alert(
        "Cette occurrence mensuelle est générée automatiquement. Éditez la transaction d’origine."
      );
      setEditing(null);
      return;
    }
    const iso = new Date(payload.date).toISOString();

    await updateTx(current.id, {
      accountId: payload.accountId,
      type: payload.type,
      amount: payload.amount,
      date: iso,
      recurrence: payload.recurrence,
      detail: payload.detail,
      comment: (payload.comment || "").trim(),
    });

    const updated: Transaction = {
      ...current,
      accountId: payload.accountId,
      type: payload.type,
      amount: payload.amount,
      date: iso,
      recurrence: payload.recurrence,
      detail: payload.detail,
      comment: (payload.comment || "").trim(),
    };

    const base = tx.map((t) => (t.id === updated.id ? updated : t));
    const next = materializeMonthly(base);
    setTx(next);
    setEditing(null);
  }

  async function removeOne(id: string) {
    const current = tx.find((t) => t.id === id);
    if (current?.parentId) {
      alert(
        "Cette occurrence mensuelle est générée automatiquement. Supprimez la transaction d’origine."
      );
      setAskDelete(null);
      return;
    }
    await deleteTx(id);
    const base = tx.filter((t) => t.id !== id);
    const next = materializeMonthly(base);
    setTx(next);
    setAskDelete(null);
  }

  function exportTxPDF(landscape = true) {
    const LOGO_URL = `${window.location.origin}/logo.svg`;
    const today = new Date().toLocaleString("fr-FR");

    // on génère les lignes du tableau
    const rowsHtml = filtered
      .map((t, idx) => {
        const acc = accById.get(t.accountId);
        const isIncome = t.type === "income";
        const sign = isIncome ? 1 : -1;
        const amount = sign * Math.abs(Number(t.amount) || 0);
        const money = fmtMoney(amount, globalCur);
        const dateStr = new Date(t.date).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        // toutes les 25 lignes on force une page-break
        const pageBreak =
          (idx + 1) % 25 === 0
            ? `<tr class="pb"><td colspan="7"></td></tr>`
            : "";

        return `
        <tr class="row ${idx % 2 === 0 ? "even" : "odd"}">
          <td class="date">${dateStr}</td>
          <td class="account">${escapeHtml(acc?.name ?? "—")}</td>
          <td class="type ${isIncome ? "income" : "expense"}">
            ${isIncome ? "Revenu" : "Dépense"}
          </td>
          <td class="rec">${
            t.recurrence === "mensuel" ? "Mensuel" : "Fixe"
          }</td>
          <td class="detail">${escapeHtml(t.detail)}</td>
          <td class="amount ${isIncome ? "amount-inc" : "amount-exp"}">
            ${escapeHtml(money)}
          </td>
          <td class="comment">
            ${
              t.comment ? escapeHtml(t.comment) : "<span class='muted'>—</span>"
            }
          </td>
        </tr>
        ${pageBreak}
      `;
      })
      .join("");

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Transactions – PDF</title>
  <style>
    @page { size: A4 ${landscape ? "landscape" : ""}; margin: 10mm; }
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font: 11px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif;
      color: #0f172a;
      background: #e2e8f0;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 8mm;
    }
    .brand-left {
      display:flex;
      gap:10px;
      align-items:center;
    }
    .brand img { height: 20px; }
    h1 { font-size: 15px; margin: 0; }
    .muted { color: #64748b; font-size: 10.5px; }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(15,23,42,.035);
    }
    thead {
      background: #0f172a;
      color: #fff;
    }
    th {
      text-align: left;
      padding: 6px 6px;
      font-size: 10.5px;
      white-space: nowrap;
    }
    th.amount { text-align: right; }
    tbody tr.even { background: #f8fafc; }
    tbody tr.odd { background: #ffffff; }
    td {
      padding: 5px 6px;
      vertical-align: top;
      font-size: 10.5px;
      border-bottom: 1px solid rgba(15,23,42,.03);
      word-break: break-word;
    }
    td.date { width: 60px; white-space: nowrap; }
    td.account { width: 110px; }
    td.type { width: 65px; font-weight: 600; }
    td.rec { width: 55px; white-space: nowrap; }
    td.detail { width: 90px; text-transform: capitalize; }
    td.amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    td.comment { width: 180px; }
    .income {
      background: rgba(16,185,129,0.08);
      color: #047857;
      border: 1px solid rgba(16,185,129,0.12);
      border-radius: 5px;
      display: inline-block;
      padding: 1px 6px;
    }
    .expense {
      background: rgba(244,63,94,0.08);
      color: #be123c;
      border: 1px solid rgba(244,63,94,0.12);
      border-radius: 5px;
      display: inline-block;
      padding: 1px 6px;
    }
    .amount-inc { color: #166534; }
    .amount-exp { color: #b91c1c; }
    .comment .muted { color: #94a3b8; font-style: italic; }
    /* saut de page forcé */
    .pb {
      page-break-after: always;
      height: 0;
      border: 0;
      padding: 0;
    }
    .footer {
      margin-top: 5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #94a3b8;
    }
    .footer .right {
      display:flex;
      gap:6px;
      align-items:center;
    }
    .footer img { height: 14px; }
  </style>
</head>
<body>
  <header class="brand">
    <div class="brand-left">
      <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
      <div>
        <h1>Transactions (filtrées)</h1>
        <div class="muted">Exporté le ${escapeHtml(today)}</div>
      </div>
    </div>
    <div class="muted">${escapeHtml(globalCur)}</div>
  </header>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Compte</th>
        <th>Type</th>
        <th>Réc.</th>
        <th>Libellé</th>
        <th class="amount">Montant</th>
        <th>Commentaire</th>
      </tr>
    </thead>
    <tbody>
      ${
        rowsHtml ||
        `<tr><td colspan="7" style="text-align:center; padding:10px;">Aucune transaction.</td></tr>`
      }
    </tbody>
  </table>

  <footer class="footer">
    <span>© ${new Date().getFullYear()} FullMargin</span>
    <span class="right">
      <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
      Fait sur <b>www.fullmargin.net</b>
    </span>
  </footer>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 600);
      }, 150);
    };
  }

  const hasAccounts = accounts.length > 0;

  const resetFilters = () => {
    setQ("");
    setTypeFilter("");
    setAccFilter("");
    setFromDate("");
    setToDate("");
  };

  return (
    <section className="space-y-4">
      {/* 1. Barre outils */}
      <div
        className="
    rounded-2xl border border-slate-200/60 dark:border-slate-800
    bg-white/70 dark:bg-slate-900/70 backdrop-blur p-4 shadow-sm
    flex flex-nowrap items-center gap-3
    overflow-x-auto
  "
      >
        <button
          onClick={() => setOpenForm(true)}
          disabled={!hasAccounts}
          aria-label="Créer une transaction"
          title="Créer une transaction"
          className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-fm-primary text-skin-primary-foreground hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Créer</span>
        </button>
        <button
          onClick={() => exportTxPDF(true)}
          aria-label="Exporter un PDF"
          title="Exporter un PDF (paysage)"
          className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {/* 2. Bloc filtres */}
      <div
        className={
          filtersOpen
            ? "rounded-2xl p-4 pb-3 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60"
            : "rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60"
        }
      >
        <div
          className={
            filtersOpen
              ? "flex items-center justify-between gap-3 mb-3"
              : "flex items-center justify-between gap-3"
          }
        >
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0 ml-auto"
            title={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {filtersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {filtersOpen && (
          <div
            className="
        grid gap-3
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-6
      "
          >
            {/* recherche */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Recherche</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Compte, détail, commentaire, montant, date…"
                  className="w-full h-10 rounded-lg pl-9 pr-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </label>

            {/* compte */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Compte</span>
              <select
                value={accFilter}
                onChange={(e) => setAccFilter(e.target.value)}
                className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">Tous les comptes</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            {/* type */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "" | TxType)}
                className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">Tous les types</option>
                <option value="income">Revenus</option>
                <option value="expense">Dépenses</option>
              </select>
            </label>

            {/* date début */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Date début</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
              />
            </label>

            {/* date fin */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Date fin</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
              />
            </label>


          </div>
        )}

        {!hasAccounts && !loading && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            Créez d’abord au moins un compte dans l’onglet{" "}
            <strong>Mes comptes</strong> pour pouvoir enregistrer des
            transactions.
          </div>
        )}
      </div>

      {/* 2bis. Onglets de vue */}
      <div
        className="
    flex gap-2 rounded-2xl border border-slate-200 dark:border-slate-800
    bg-white/60 dark:bg-slate-900/50 p-2
    overflow-x-auto flex-nowrap
  "
      >
        <button
          type="button"
          onClick={() => setActiveTab("byAccount")}
          className={
            activeTab === "byAccount"
              ? "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap bg-slate-200/80 text-slate-900 dark:bg-slate-100/10 dark:text-white dark:ring-1 dark:ring-slate-500/40"
              : "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap text-slate-600 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
          }
        >
          Transactions par compte
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={
            activeTab === "all"
              ? "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap bg-slate-200/80 text-slate-900 dark:bg-slate-100/10 dark:text-white dark:ring-1 dark:ring-slate-500/40"
              : "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap text-slate-600 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
          }
        >
          Toutes les transactions
        </button>
      </div>

      {/* 3. Contenu */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Chargement des transactions…
          </p>
        </div>
      ) : activeTab === "byAccount" ? (
        /* === VUE PAR COMPTE (ton code d’origine) === */
        <div className="space-y-4">
          {groups.map(([accId, arr]) => {
            const isClosed = collapsed.has(accId);
            const acc = accById.get(accId);
            const title = acc?.name ?? "Compte";
            return (
              <section
                key={accId}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                <header className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCollapsed((prev) => {
                          const nxt = new Set(prev);
                          if (nxt.has(accId)) nxt.delete(accId);
                          else nxt.add(accId);
                          return nxt;
                        })
                      }
                      className="h-9 w-9 grid place-items-center rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      aria-label={isClosed ? "Déplier" : "Replier"}
                      title={isClosed ? "Déplier" : "Replier"}
                    >
                      {isClosed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm sm:text-base font-semibold">
                        {title}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {globalCur}
                      </span>
                    </div>
                    <span className="ml-2 text-xs text-slate-500">
                      {arr.length} transaction{arr.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </header>

                {!isClosed && (
                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4">
                      {arr.map((t) => {
                        const sign = t.type === "expense" ? -1 : 1;
                        const money = fmtMoney(
                          sign * Math.abs(t.amount),
                          globalCur
                        );
                        const dateStr = new Date(t.date).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        );
                        return (
                          <CardTx
                            key={t.id}
                            tx={t}
                            accountName={acc?.name ?? "—"}
                            currency={globalCur}
                            money={money}
                            dateStr={dateStr}
                            onEdit={() => setEditing(t)}
                            onDelete={() => setAskDelete(t)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {groups.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Aucune transaction ne correspond à vos filtres.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* === VUE TOUTES LES TRANSACTIONS (à plat) === */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3 sm:p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-300 py-6">
              Aucune transaction ne correspond à vos filtres.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4">
              {filtered.map((t) => {
                const acc = accById.get(t.accountId);
                const sign = t.type === "expense" ? -1 : 1;
                const money = fmtMoney(sign * Math.abs(t.amount), globalCur);
                const dateStr = new Date(t.date).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                return (
                  <CardTx
                    key={t.id}
                    tx={t}
                    accountName={acc?.name ?? "—"}
                    currency={globalCur}
                    money={money}
                    dateStr={dateStr}
                    onEdit={() => setEditing(t)}
                    onDelete={() => setAskDelete(t)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulaire + Confirm */}
      {(openForm || editing) && (
        <TxForm
          open={openForm || !!editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          accounts={accounts}
          initial={editing ?? undefined}
          onSubmit={(payload) => {
            if (editing) {
              updateOne(editing, payload);
            } else {
              createOne(payload);
            }
          }}
        />
      )}

      <Confirm
        open={!!askDelete}
        title="Supprimer la transaction"
        message={`Voulez-vous vraiment supprimer cette transaction ?`}
        onCancel={() => setAskDelete(null)}
        onConfirm={() => askDelete && removeOne(askDelete.id)}
      />
    </section>
  );
}
