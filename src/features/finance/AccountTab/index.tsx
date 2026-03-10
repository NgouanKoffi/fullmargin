// src/pages/finance/AccountTab/index.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  X,
  DollarSign,
  Calendar,
  RotateCcw,
} from "lucide-react";
import {
  type Account,
  type Currency,
  type Transaction,
  CURRENCY_META,
  fmtMoney,
} from "../core/types";
import AccountCard, { Sparkline } from "./AccountCard";
import AccountModal from "./AccountModal";
import { Confirm } from "./ui";
import {
  fetchAccounts,
  fetchTransactions,
  loadGlobalCurrency,
  saveGlobalCurrency,
  createAccount as apiCreateAccount,
  patchAccount as apiPatchAccount,
  removeAccount as apiRemoveAccount,
} from "../core/storage";

type Point = { x: number; y: number };

/* ===================== UI prefs ===================== */
const FIN_FILTERS_KEY = "fm.finance.filters.open";

// On garde l'écriture si besoin, mais on n'utilise plus la lecture au démarrage
function writeBoolLS(key: string, v: boolean) {
  try {
    window.localStorage.setItem(key, v ? "1" : "0");
  } catch {
    // ignore
  }
}

export default function AccountsTab() {
  const [items, setItems] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ CORRECTION : Filtres toujours fermés par défaut au chargement
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // devise globale
  const [globalCur, setGlobalCur] = useState<Currency>("XOF");

  // CRUD modals
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [askDelete, setAskDelete] = useState<Account | null>(null);

  // modal détails
  const [detailsOf, setDetailsOf] = useState<{
    acc: Account;
    stats: { income: number; expense: number };
    series: Point[];
  } | null>(null);

  /* persist open/close (optionnel si tu veux juste fermer au refresh, mais garder en session) */
  useEffect(() => {
    writeBoolLS(FIN_FILTERS_KEY, filterOpen);
  }, [filterOpen]);

  /* ===================== init ===================== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accs, tx, cur] = await Promise.all([
          fetchAccounts(),
          fetchTransactions(),
          loadGlobalCurrency(),
        ]);
        if (cancelled) return;
        setItems(accs);
        setTxs(tx);
        if (cur) setGlobalCur(cur);
      } catch (e) {
        console.error("AccountsTab: backend indisponible", e);
        if (!cancelled) setErr("Backend indisponible");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* =============== filtrage simple ================= */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fromTs = fromDate
      ? new Date(fromDate + "T00:00:00").getTime()
      : -Infinity;
    const toTs = toDate
      ? new Date(toDate + "T23:59:59.999").getTime()
      : +Infinity;

    return items.filter((a) => {
      const hay = [a.name, a.currency, a.description || ""]
        .join(" ")
        .toLowerCase();
      const okText = !s || hay.includes(s);
      const createdAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const okDate = createdAt >= fromTs && createdAt <= toTs;
      return okText && okDate;
    });
  }, [items, q, fromDate, toDate]);

  /* ============ stats + séries par compte ============ */
  const { statsByAccount, seriesByAccount } = useMemo(() => {
    const now = Date.now();
    const accStats = new Map<string, { income: number; expense: number }>();
    const byAcc = new Map<string, Transaction[]>();

    for (const t of txs) {
      if (!t.accountId) continue;
      const ts = new Date(t.date).getTime();
      if (ts > now) continue;

      if (!byAcc.has(t.accountId)) byAcc.set(t.accountId, []);
      byAcc.get(t.accountId)!.push(t);

      const bucket = accStats.get(t.accountId) || { income: 0, expense: 0 };
      const amt = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") bucket.income += amt;
      else bucket.expense += amt;
      accStats.set(t.accountId, bucket);
    }

    const accSeries = new Map<string, Point[]>();
    for (const a of items) {
      const created = a.createdAt
        ? new Date(a.createdAt).getTime()
        : Date.now();
      const list = (byAcc.get(a.id) || [])
        .slice()
        .sort(
          (x, y) => new Date(x.date).getTime() - new Date(y.date).getTime(),
        );

      const pts: Point[] = [];
      let running = Number(a.initial) || 0;
      pts.push({ x: created - 1, y: running });

      for (const t of list) {
        const sign = t.type === "expense" ? -1 : 1;
        const amt = Math.abs(Number(t.amount) || 0) * sign;
        running += amt;
        pts.push({ x: new Date(t.date).getTime(), y: running });
      }

      if (pts.length === 1) pts.push({ x: created, y: running });
      accSeries.set(a.id, pts);
    }

    return { statsByAccount: accStats, seriesByAccount: accSeries };
  }, [txs, items]);

  /* ================ export PDF ================= */
  function escapeHtml(s: unknown) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function exportAccountsPDF(landscape = true) {
    const LOGO_URL = `${window.location.origin}/logo.svg`;
    const today = new Date().toLocaleString("fr-FR");

    const chunk = <T,>(arr: T[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size),
      );

    const renderCard = (a: Account) => {
      const st = statsByAccount.get(a.id) || { income: 0, expense: 0 };
      const series = seriesByAccount.get(a.id) || [];
      const balance = series.length
        ? series[series.length - 1].y
        : (Number(a.initial) || 0) + (st.income - st.expense);
      const cur = globalCur;
      const grad =
        cur === "USD"
          ? "linear-gradient(135deg,#6366F1,#0EA5E9)"
          : cur === "EUR"
            ? "linear-gradient(135deg,#10B981,#84CC16)"
            : "linear-gradient(135deg,#A855F7,#EC4899)";

      return `
<article class="card">
  <div class="stripe" style="background:${grad}"></div>
  <header class="hd">
    <div class="title" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</div>
    <div class="pill">${escapeHtml(cur)}</div>
  </header>
  <div class="meta">ID : ${escapeHtml(a.id)}</div>
  <div class="grid">
    <div><b>Solde initial:</b> ${escapeHtml(fmtMoney(a.initial, cur))}</div>
    <div><b>Solde actuel:</b> <span class="${
      balance < 0 ? "neg" : "pos"
    }">${escapeHtml(fmtMoney(balance, cur))}</span></div>
    <div><b>Revenus:</b> ${escapeHtml(fmtMoney(st.income, cur))}</div>
    <div><b>Dépenses:</b> ${escapeHtml(fmtMoney(st.expense, cur))}</div>
  </div>
  <div class="desc">${escapeHtml(a.description || "—")}</div>
  <div class="foot">Créé le ${escapeHtml(
    new Date(a.createdAt).toLocaleString("fr-FR"),
  )}</div>
</article>`;
    };

    const pagesHtml = chunk(filtered, 4)
      .map(
        (group) => `<section class="page">
          ${group.map(renderCard).join("")}
        </section>`,
      )
      .join("");

    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Comptes – PDF</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : ""}; margin: 14mm 12mm 24mm; }
  html,body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 11px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif; color:#0f172a; }
  .brand { display:flex; align-items:center; gap:10px; margin:0 0 8px 0; }
  .brand img { height:18px; }
  h1 { font-size:16px; margin:0 0 2px 0; letter-spacing:-.2px; }
  .muted { color:#64748b; margin:0 0 8px 0; }
  :root { --gap:6mm; --card-h: 62mm; }
  .page { display:grid; grid-template-columns: 1fr 1fr; grid-auto-rows: var(--card-h); gap:var(--gap); break-after: page; }
  .page:last-child { break-after: auto; }
  .card { box-sizing:border-box; border:1px solid #dbe2ea; border-radius:12px; background:#fff; padding:8px 10px 10px; height:var(--card-h); overflow:hidden; position:relative; box-shadow:0 1px 0 rgba(2,6,23,.04); }
  .stripe { position:absolute; left:0; top:0; right:0; height:3px; border-radius:12px 12px 0 0; }
  .hd { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
  .title { font-weight:700; font-size:12px; margin-right:8px; }
  .pill { font-size:10px; font-weight:700; padding:1px 6px; border-radius:999px; background:#eef2ff; color:#1e293b; border:1px solid #c7d2fe; }
  .meta { color:#64748b; font-size:10px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; margin-top:6px; }
  .desc { font-size:11px; color:#334155; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:5px; margin-top:6px; min-height:22px; }
  .foot { margin-top:6px; font-size:10px; color:#64748b; }
  .pos { color:#047857; } .neg { color:#b91c1c; }
  .signature { position: fixed; left: 12mm; right: 12mm; bottom: 8mm; display:flex; align-items:center; justify-content: space-between; font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:4px; }
  .signature img { height:14px; }
</style></head>
<body>
  <div class="brand">
    <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
    <div>
      <h1>Comptes</h1>
      <div class="muted">Exporté le ${escapeHtml(today)}</div>
    </div>
  </div>
  ${
    pagesHtml ||
    `<section class="page"><div class="muted">Aucun compte</div></section>`
  }
  <div class="signature">
    <span>© ${new Date().getFullYear()} FullMargin</span>
    <span class="right">
      <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
      Fait sur <b>www.fullmargin.net</b>
    </span>
  </div>
</body></html>`;

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
      }, 200);
    };
  }

  /* ============== CRUD réels (remis) ============== */
  async function createOne(payload: {
    name: string;
    initial: number;
    description?: string;
  }) {
    try {
      const res = await apiCreateAccount({
        name: payload.name.trim(),
        currency: globalCur,
        initial: Number(payload.initial) || 0,
        description: (payload.description || "").trim(),
      });
      const acc: Account = {
        id: res.id,
        name: payload.name.trim(),
        currency: globalCur,
        initial: Number(payload.initial) || 0,
        description: (payload.description || "").trim(),
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [acc, ...prev]);
    } catch (e) {
      console.error("create account failed", e);
      alert("Création impossible pour le moment.");
    } finally {
      setCreating(false);
    }
  }

  async function updateOne(
    acc: Account,
    payload: { name: string; initial: number; description?: string },
  ) {
    try {
      await apiPatchAccount(acc.id, {
        name: payload.name.trim(),
        initial: Number(payload.initial) || 0,
        description: (payload.description || "").trim(),
      });
      setItems((prev) =>
        prev.map((x) =>
          x.id === acc.id
            ? {
                ...x,
                name: payload.name.trim(),
                initial: Number(payload.initial) || 0,
                description: (payload.description || "").trim(),
              }
            : x,
        ),
      );
    } catch (e) {
      console.error("update account failed", e);
      alert("Sauvegarde impossible pour le moment.");
    } finally {
      setEditing(null);
    }
  }

  async function confirmDelete(id: string) {
    try {
      await apiRemoveAccount(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error("delete account failed", e);
      alert("Suppression impossible pour le moment.");
    } finally {
      setAskDelete(null);
    }
  }

  /* ============== helpers UI ============== */
  const resetFilters = () => {
    setQ("");
    setFromDate("");
    setToDate("");
  };

  const activeCount = useMemo(() => {
    let c = 0;
    if (q.trim()) c += 1;
    if (fromDate) c += 1;
    if (toDate) c += 1;
    // globalCur n'est pas un "filtre", donc on ne le compte pas.
    return c;
  }, [q, fromDate, toDate]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    const qq = q.trim();
    if (qq)
      parts.push(`Recherche: ${qq.length > 18 ? qq.slice(0, 18) + "…" : qq}`);
    if (fromDate || toDate)
      parts.push(`Période: ${fromDate || "…"} → ${toDate || "…"}`);
    return parts.join(" · ");
  }, [q, fromDate, toDate]);

  return (
    <section className="space-y-4">
      {/* barre d'actions centrée */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-wrap justify-center items-center gap-3">
        <button
          onClick={() => setCreating(true)}
          className="h-10 rounded-lg bg-fm-primary text-white px-4 text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Créer</span>
        </button>
        <button
          onClick={() => exportAccountsPDF(true)}
          className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-medium text-slate-700 dark:text-slate-100 inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Télécharger</span>
        </button>
      </div>

      {/* bloc FILTRES (fermé par défaut + compact) */}
      <div
        className={
          filterOpen
            ? "rounded-2xl p-4 pb-3 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60"
            : "rounded-2xl px-4 py-3 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60"
        }
      >
        <div
          className={
            "flex items-center justify-between gap-3" +
            (filterOpen ? " mb-3" : "")
          }
        >
          {/* Bouton Reset à GAUCHE */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>

          {/* Badges et résumé au CENTRE */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {activeCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-fm-primary text-white text-[11px] px-2 py-0.5">
                {activeCount}
              </span>
            )}

            {!filterOpen && summary ? (
              <span className="hidden sm:inline text-xs text-slate-400 truncate">
                {summary}
              </span>
            ) : null}
          </div>

          {/* Bouton Filtres à DROITE */}
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0"
            title={filterOpen ? "Masquer les filtres" : "Afficher les filtres"}
            aria-expanded={filterOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {filterOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {filterOpen && (
          <div
            className="
              grid gap-3
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-5
            "
          >
            {/* devise globale */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Devise globale</span>
              <select
                value={globalCur}
                onChange={(e) => {
                  const next = e.target.value as Currency;
                  setGlobalCur(next);
                  saveGlobalCurrency(next).catch((err) =>
                    console.warn("saveGlobalCurrency failed", err),
                  );
                }}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                {(Object.keys(CURRENCY_META) as Currency[])
                  .filter((c) => c !== "FCFA")
                  .map((code) => (
                    <option key={code} value={code}>
                      {code} — {CURRENCY_META[code].name} (
                      {CURRENCY_META[code].symbol})
                    </option>
                  ))}
              </select>
            </label>

            {/* recherche */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Recherche</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un compte (nom, devise, description)…"
                  className="w-full h-10 rounded-lg pl-9 pr-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
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

        {err && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </div>

      {/* cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((a) => {
          const stats = statsByAccount.get(a.id) || { income: 0, expense: 0 };
          const series = seriesByAccount.get(a.id) || [
            { x: new Date(a.createdAt).getTime(), y: Number(a.initial) || 0 },
          ];
          return (
            <AccountCard
              key={a.id}
              a={a}
              stats={stats}
              onEdit={() => setEditing(a)}
              onDelete={() => setAskDelete(a)}
              overrideCurrency={globalCur}
              onShowDetails={() => setDetailsOf({ acc: a, stats, series })}
            />
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-slate-600 dark:text-slate-300">
              {loading
                ? "Chargement…"
                : "Aucun compte ne correspond à vos filtres."}
            </p>
          </div>
        )}
      </div>

      {/* modal création */}
      <AccountModal
        open={creating}
        onClose={() => setCreating(false)}
        title="Créer un compte"
        onSubmit={createOne}
      />

      {/* modal édition */}
      {editing && (
        <AccountModal
          open={true}
          onClose={() => setEditing(null)}
          title="Modifier le compte"
          initial={{
            name: editing.name,
            initial: editing.initial,
            description: editing.description || "",
          }}
          onSubmit={(payload) => updateOne(editing, payload)}
        />
      )}

      {/* confirm delete */}
      <Confirm
        open={!!askDelete}
        title="⚠️ Supprimer le compte"
        message={`Voulez-vous vraiment supprimer le compte « ${
          askDelete?.name ?? ""
        } » ?\n\n⚠️ ATTENTION : Cette action est irréversible !\n\n• Le compte sera définitivement supprimé\n• Toutes les transactions liées à ce compte seront également supprimées\n• Vous ne pourrez pas récupérer ces données`}
        onCancel={() => setAskDelete(null)}
        onConfirm={() => askDelete && confirmDelete(askDelete.id)}
      />

      {/* modal détails */}
      {detailsOf &&
        createPortal(
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-3">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
              <header className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold">
                    {detailsOf.acc.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    ID : {detailsOf.acc.id}
                  </p>
                </div>
                <button
                  onClick={() => setDetailsOf(null)}
                  className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-4 space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-3">
                  <Sparkline points={detailsOf.series} height={200} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                      Solde initial
                    </div>
                    <div className="flex items-center gap-2 text-lg font-semibold tabular-nums">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      {fmtMoney(Number(detailsOf.acc.initial) || 0, globalCur)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/70 dark:border-emerald-800/50 p-3">
                    <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-1">
                      Total gains
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {fmtMoney(detailsOf.stats.income, globalCur)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200/70 dark:border-rose-800/50 p-3">
                    <div className="text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300 mb-1">
                      Total dépenses
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                      {fmtMoney(detailsOf.stats.expense, globalCur)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Créé le{" "}
                      {detailsOf.acc.createdAt
                        ? new Date(detailsOf.acc.createdAt).toLocaleString(
                            "fr-FR",
                          )
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    Description
                  </div>
                  {detailsOf.acc.description ? (
                    <p className="text-sm text-slate-700 dark:text-slate-100 whitespace-pre-wrap">
                      {detailsOf.acc.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Aucune description fournie.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
