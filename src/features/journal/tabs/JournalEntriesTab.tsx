// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\journal\tabs\JournalEntriesTab.tsx
import { useEffect, useMemo, useState } from "react";

import JournalToolbar from "./journal/JournalToolbar";
import JournalForm from "./journal/JournalForm";
import ConfirmModal from "./journal/ConfirmModal";
import type { Id, JournalEntry, Currency } from "../types";
import JournalTable from "./journal/JournalTable";
import { fmtMoney } from "../utils";

// API (backend)
import {
  listJournal,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  listJournalAccounts,
} from "../api";

type JournalEntryExt = JournalEntry & { images?: string[] };

export default function JournalEntriesTab() {
  const [entries, setEntries] = useState<JournalEntryExt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntryExt | null>(null);
  const [askDel, setAskDel] = useState<JournalEntryExt | null>(null);
  const [askBulkDel, setAskBulkDel] = useState<JournalEntryExt[]>([]);

  // filtres
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [accountId, setAccountId] = useState<string>("");
  const [marketId, setMarketId] = useState<string>("");
  const [strategyId, setStrategyId] = useState<string>("");
  const [order, setOrder] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [respect, setRespect] = useState<string>("");
  const [session, setSession] = useState<string>("");

  // devise d’affichage (vient du serveur, fallback USD)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");

  // ----------- chargement initial depuis l’API -----------
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // 1) liste légère (maintenant complète grâce à l'optimisation backend/api.ts)
        const [journalRes, accRes] = await Promise.all([
          listJournal({ limit: 500 }),
          listJournalAccounts({ limit: 50 }),
        ]);

        if (!alive) return;

        // Grâce à l'optimisation, journalRes.items contient déjà tout ce qu'il faut (lot, detail, images...)
        // On n'a plus besoin de requêter 500 fois getJournal()
        setEntries((journalRes.items || []) as JournalEntryExt[]);

        if (accRes.items && accRes.items.length > 0) {
          setDisplayCurrency(accRes.items[0].currency);
        } else {
          setDisplayCurrency("USD");
        }
      } catch (err) {
        console.warn("[Journal] chargement API impossible :", err);
        if (alive) {
          setEntries([]);
          setDisplayCurrency("USD");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const resetFilters = () => {
    setQ("");
    setFrom("");
    setTo("");
    setAccountId("");
    setMarketId("");
    setStrategyId("");
    setOrder("");
    setResult("");
    setRespect("");
    setSession("");
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return entries.filter((e) => {
      const inText =
        !text ||
        [
          e.accountName,
          e.marketName,
          e.strategyName,
          e.comment,
          e.detail,
          ...(e.timeframes || []),
          e.session || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(text);

      const d = e.date || e.createdAt.slice(0, 10);
      const okFrom = !from || d >= from;
      const okTo = !to || d <= to;

      const okAccount = !accountId || e.accountId === accountId;
      const okMarket = !marketId || e.marketId === marketId;
      const okStrategy = !strategyId || e.strategyId === strategyId;
      const okOrder = !order || e.order === order;
      const okResult = !result || e.result === result;
      const okRespect = !respect || e.respect === respect;
      const okSession = !session || e.session === session;

      return (
        inText &&
        okFrom &&
        okTo &&
        okAccount &&
        okMarket &&
        okStrategy &&
        okOrder &&
        okResult &&
        okRespect &&
        okSession
      );
    });
  }, [
    entries,
    q,
    from,
    to,
    accountId,
    marketId,
    strategyId,
    order,
    result,
    respect,
    session,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Création / mise à jour : API only                                      */
  /* ---------------------------------------------------------------------- */
  async function upsert(entry: JournalEntryExt) {
    const isEdit = !!editing?.id;

    try {
      if (isEdit) {
        const payload = { ...editing, ...entry, id: editing!.id };
        await updateJournal(editing!.id, payload);
        setEntries((prev) =>
          prev.map((x) =>
            x.id === editing!.id ? (payload as JournalEntryExt) : x
          )
        );
      } else {
        // création → on relit l’entrée complète pour avoir les ...Name + images normalisées
        const toCreate = { ...entry };
        const { id } = await createJournal(toCreate);
        const createdFull = await getJournal(id);
        setEntries((prev) => [createdFull as JournalEntryExt, ...prev]);
      }
      setEditing(null);
      setOpenForm(false);
    } catch (err) {
      console.error("[Journal] Échec upsert API :", err);
      alert("Impossible d’enregistrer pour le moment. Réessaie plus tard.");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Mise à jour rapide                                                     */
  /* ---------------------------------------------------------------------- */
  const onQuickUpdate = async (id: Id, patch: Partial<JournalEntry>) => {
    try {
      const current = entries.find((x) => x.id === id);
      if (!current) return;
      const payload = { ...current, ...patch };
      await updateJournal(id, payload as JournalEntry);
      setEntries((prev) =>
        prev.map((x) => (x.id === id ? (payload as JournalEntryExt) : x))
      );
    } catch (err) {
      console.error("[Journal] Échec de la mise à jour :", err);
      alert("Mise à jour impossible pour le moment.");
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Suppression                                                            */
  /* ---------------------------------------------------------------------- */
  async function onDelete(id: Id) {
    try {
      await deleteJournal(id);
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error("[Journal] Échec de la suppression :", err);
      alert("Suppression impossible pour le moment.");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Suppression en masse                                                    */
  /* ---------------------------------------------------------------------- */
  async function onBulkDelete(entriesToDelete: JournalEntryExt[]) {
    try {
      await Promise.all(entriesToDelete.map((e) => deleteJournal(e.id)));
      const deletedIds = new Set(entriesToDelete.map((e) => e.id));
      setEntries((prev) => prev.filter((x) => !deletedIds.has(x.id)));
    } catch (err) {
      console.error("[Journal] Échec de la suppression en masse :", err);
      alert("Suppression en masse impossible pour le moment.");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Export PDF                                                             */
  /* ---------------------------------------------------------------------- */
  function exportJournalPDF(landscape = true) {
    const LOGO_URL = `${window.location.origin}/logo.svg`;

    const escapeHtml = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const toNum = (x: unknown) =>
      Number(
        String(x ?? "")
          .replace(/\s/g, "")
          .replace(",", ".")
      );

    type LabelKind = "account" | "market" | "strategy";

    const findName = (id: string, kind: LabelKind): string => {
      if (!id) return "";
      const match = entries.find((e) =>
        kind === "account"
          ? e.accountId === id
          : kind === "market"
          ? e.marketId === id
          : e.strategyId === id
      );
      if (!match) return id;
      return kind === "account"
        ? match.accountName || id
        : kind === "market"
        ? match.marketName || id
        : match.strategyName || id;
    };

    const today = new Date().toLocaleString("fr-FR");

    const filters =
      [
        q.trim() ? `Texte: “${q.trim()}”` : "",
        from ? `Du ${from}` : "",
        to ? `Au ${to}` : "",
        accountId
          ? `Compte: ${escapeHtml(findName(accountId, "account"))}`
          : "",
        marketId ? `Marché: ${escapeHtml(findName(marketId, "market"))}` : "",
        strategyId
          ? `Stratégie: ${escapeHtml(findName(strategyId, "strategy"))}`
          : "",
        order ? `Ordre: ${order}` : "",
        result ? `Résultat: ${result}` : "",
        respect ? `Respect: ${respect}` : "",
        session ? `Session: ${session}` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Tous les journaux";

    // 👇 ICI on ne fait plus un <table>, on fait une liste de cartes
    const entriesHtml = filtered
      .map((e, idx) => {
        const sessionLabel =
          e.session === "london"
            ? "London"
            : e.session === "newyork"
            ? "New York"
            : e.session === "asiatique"
            ? "Asiatique"
            : "—";

        const investedNum = toNum(e.invested);
        const resultNum = toNum(e.resultMoney);

        return `
      <div class="entry-card">
        <div class="entry-head">
          <div class="entry-title">
            <span class="entry-date">${escapeHtml(
              e.date || e.createdAt.slice(0, 10)
            )}</span>
            <span class="entry-market">${escapeHtml(e.marketName || "")}</span>
          </div>
          <div class="entry-id">#${idx + 1}</div>
        </div>

        <div class="entry-grid">
          <div class="entry-field">
            <div class="label">Compte</div>
            <div class="val">${escapeHtml(e.accountName || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Stratégie</div>
            <div class="val">${escapeHtml(e.strategyName || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Ordre</div>
            <div class="val">${escapeHtml(e.order || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Lot</div>
            <div class="val">${escapeHtml(e.lot || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Investi</div>
            <div class="val">${
              Number.isFinite(investedNum)
                ? escapeHtml(fmtMoney(investedNum, displayCurrency))
                : escapeHtml(e.invested || "")
            }</div>
          </div>
          <div class="entry-field">
            <div class="label">Résultat (devise)</div>
            <div class="val ${
              Number.isFinite(resultNum) && resultNum < 0 ? "bad" : ""
            }">${
          Number.isFinite(resultNum)
            ? escapeHtml(fmtMoney(resultNum, displayCurrency))
            : escapeHtml(e.resultMoney || "")
        }</div>
          </div>
          <div class="entry-field">
            <div class="label">Résultat</div>
            <div class="val">${escapeHtml(e.result || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Résultat %</div>
            <div class="val">${escapeHtml(
              (e.resultPct ? String(e.resultPct) : "") +
                (e.resultPct ? " %" : "")
            )}</div>
          </div>
          <div class="entry-field">
            <div class="label">Détail</div>
            <div class="val">${escapeHtml(e.detail || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Respect</div>
            <div class="val">${escapeHtml(e.respect || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">Durée</div>
            <div class="val">${escapeHtml(e.duration || "")}</div>
          </div>
          <div class="entry-field">
            <div class="label">UT</div>
            <div class="val">${escapeHtml(
              (e.timeframes || []).join(", ") || ""
            )}</div>
          </div>
          <div class="entry-field">
            <div class="label">Session</div>
            <div class="val">${escapeHtml(sessionLabel)}</div>
          </div>
        </div>

        ${
          e.comment
            ? `<div class="entry-comment">
                 <div class="label">Commentaire</div>
                 <div class="comment-text">${escapeHtml(e.comment)}</div>
               </div>`
            : ""
        }

        <!-- 👇 on NE met PAS les images dans le PDF -->
      </div>
      `;
      })
      .join("");

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Journal – PDF</title>
  <style>
    @page { size: A4 ${landscape ? "landscape" : ""}; margin: 12mm 10mm 16mm; }
    html,body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font: 11px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
      color:#0f172a;
    }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .brand img { height:18px; }
    h1 { font-size:16px; margin:0 0 2px 0; letter-spacing:-.2px; }
    .muted { color:#64748b; margin:0 0 10px 0; }

    .entries { display:flex; flex-direction:column; gap:10px; }
    .entry-card {
      border:1px solid #e2e8f0;
      border-radius:10px;
      padding:10px 12px 10px;
      background:#ffffff;
      page-break-inside: avoid;
    }
    .entry-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:6px;
    }
    .entry-title {
      display:flex;
      gap:6px;
      align-items:center;
      flex-wrap:wrap;
      font-weight:600;
    }
    .entry-date {
      padding:2px 6px;
      background:#eef2ff;
      border-radius:9999px;
      font-size:10px;
    }
    .entry-market { font-size:12px; }
    .entry-id { font-size:10px; color:#94a3b8; }

    .entry-grid {
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap:6px 10px;
    }
    .entry-field .label {
      font-size:9px;
      text-transform:uppercase;
      color:#94a3b8;
      letter-spacing:.02em;
      margin-bottom:2px;
    }
    .entry-field .val {
      font-size:11px;
      font-weight:500;
      word-break:break-word;
    }
    .entry-field .val.bad {
      color:#be123c;
    }
    .entry-comment {
      margin-top:8px;
      border-top:1px solid #e2e8f0;
      padding-top:6px;
    }
    .entry-comment .label {
      font-size:9px;
      text-transform:uppercase;
      color:#94a3b8;
      letter-spacing:.02em;
      margin-bottom:2px;
    }
    .comment-text {
      font-size:10.5px;
      white-space:pre-wrap;
      word-break:break-word;
    }

    .signature {
      position: fixed; left: 10mm; right: 10mm; bottom: 8mm;
      display:flex; align-items:center; justify-content: space-between;
      font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:4px;
    }
    .signature img { height:14px; }
  </style>
</head>
<body>
  <div class="brand">
    <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
    <div>
      <h1>Journal de trading</h1>
      <div class="muted">${escapeHtml(filters)} — ${
      filtered.length
    } entrées — exporté le ${escapeHtml(today)}</div>
    </div>
  </div>

  <div class="entries">
    ${
      entriesHtml ||
      `<div class="entry-card"><div class="entry-title">Aucun journal.</div></div>`
    }
  </div>

  <div class="signature">
    <span>© ${new Date().getFullYear()} FullMargin</span>
    <span><img src="${LOGO_URL}" alt=""> Fait sur <b>www.fullmargin.net</b></span>
  </div>
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
      }, 200);
    };
  }

  return (
    <div className="space-y-4">
      <JournalToolbar
        q={q}
        setQ={setQ}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        accountId={accountId}
        setAccountId={setAccountId}
        marketId={marketId}
        setMarketId={setMarketId}
        strategyId={strategyId}
        setStrategyId={setStrategyId}
        order={order}
        setOrder={setOrder}
        result={result}
        setResult={setResult}
        respect={respect}
        setRespect={setRespect}
        session={session}
        setSession={setSession}
        onNew={() => {
          setEditing(null);
          setOpenForm(true);
        }}
        onExport={() => exportJournalPDF(true)}
        onReset={resetFilters}
      />

      {loading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-6 text-sm">
          Chargement…
        </div>
      ) : (
        <JournalTable
          items={filtered}
          displayCurrency={displayCurrency}
          onAskDelete={(e) => setAskDel(e)}
          onBulkDelete={(entries) => setAskBulkDel(entries)}
          onQuickUpdate={onQuickUpdate}
          onEdit={(e) => {
            setEditing(e);
            setOpenForm(true);
          }}
        />
      )}

      <JournalForm
        key={openForm ? editing?.id || "new" : "closed"}
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={(e) => {
          const payload = editing ? { ...e, id: editing.id } : e;
          upsert(payload as JournalEntryExt);
        }}
        initial={editing || undefined}
      />

      <ConfirmModal
        open={!!askDel}
        title="Supprimer ce journal ?"
        message="Cette action est irréversible."
        onCancel={() => setAskDel(null)}
        onConfirm={async () => {
          if (askDel) await onDelete(askDel.id);
          setAskDel(null);
        }}
      />

      <ConfirmModal
        open={askBulkDel.length > 0}
        title={`Supprimer ${askBulkDel.length} ${askBulkDel.length === 1 ? "entrée" : "entrées"} ?`}
        message="Cette action est irréversible. Toutes les entrées sélectionnées seront supprimées."
        onCancel={() => setAskBulkDel([])}
        onConfirm={async () => {
          if (askBulkDel.length > 0) await onBulkDelete(askBulkDel);
          setAskBulkDel([]);
        }}
      />
    </div>
  );
}
