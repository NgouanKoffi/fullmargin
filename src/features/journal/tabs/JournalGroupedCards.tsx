// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\journal\tabs\JournalGroupedCards.tsx
import { useMemo, useState } from "react";
import type { JournalEntry } from "../types";
import { Pencil, Trash2, Wallet2, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  items: JournalEntry[];
  onEdit: (e: JournalEntry) => void;
  onAskDelete: (e: JournalEntry) => void;
};

const n2 = (v: unknown) => Number(String(v ?? "").replace(",", "."));
const byDateDesc = (a: JournalEntry, b: JournalEntry) =>
  (b.date || b.createdAt).localeCompare(a.date || a.createdAt);

/** Clé de groupement : par id si dispo, sinon par nom (case-insensitive) pour éviter de tout mettre sous "—" */
function groupKey(e: JournalEntry) {
  if (e.accountId) return `id:${e.accountId}`;
  const name = (e.accountName || "—").trim().toLowerCase();
  return `name:${name || "—"}`;
}
function groupLabel(arr: JournalEntry[]) {
  return arr[0]?.accountName || "Compte";
}

type GroupStat = {
  trades: number;
  wins: number;
  breakeven: number;
  gain: number;
  loss: number;
  net: number;
  winrate: number; // 0..100
};

function computeStats(arr: JournalEntry[]): GroupStat {
  let trades = 0,
    wins = 0,
    breakeven = 0,
    gain = 0,
    loss = 0;
  for (const e of arr) {
    const pnl = n2(e.resultMoney);
    trades += 1;
    if (e.result === "Gain") wins += 1;
    if (e.result === "Nul") breakeven += 1;
    if (Number.isFinite(pnl)) {
      if (pnl > 0) gain += pnl;
      else if (pnl < 0) loss += Math.abs(pnl);
    }
  }
  const net = gain - loss;
  const winrate = trades ? (wins / trades) * 100 : 0;
  return { trades, wins, breakeven, gain, loss, net, winrate };
}

export default function JournalGroupedCards({
  items,
  onEdit,
  onAskDelete,
}: Props) {
  // groupement par compte (id sinon nom)
  const groups = useMemo(() => {
    const m = new Map<string, JournalEntry[]>();
    for (const e of items) {
      const k = groupKey(e);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    // tri interne + projection
    const arr = Array.from(m.entries()).map(([k, list]) => {
      list.sort(byDateDesc);
      return {
        key: k,
        label: groupLabel(list),
        list,
        stats: computeStats(list),
      };
    });
    // tri des groupes par label alphabétique
    arr.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
    );
    return arr;
  }, [items]);

  // état des accordéons
  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({});

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300">
        Aucun journal ne correspond à vos filtres.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(({ key, label, list, stats }) => {
        const isOpen = openAcc[key] ?? true;

        return (
          <article
            key={key}
            className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition"
          >
            {/* top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500" />

            {/* header cliquable */}
            <header
              className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer select-none"
              onClick={() => setOpenAcc((s) => ({ ...s, [key]: !isOpen }))}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
                  <Wallet2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{label}</div>
                  <div className="text-[12px] text-slate-500">
                    {list.length} journal{list.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* résumé groupe */}
              <div
                className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-300"
                onClick={(e) => e.stopPropagation()}
                aria-hidden
              >
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                  Trades: <b className="ml-1">{stats.trades}</b>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                  Winrate: <b className="ml-1">{stats.winrate.toFixed(1)}%</b>
                </span>
                <span
                  className={[
                    "inline-flex items-center px-2 py-0.5 rounded-md ring-1",
                    stats.net >= 0
                      ? "bg-emerald-50 ring-emerald-200 text-emerald-700 dark:bg-emerald-900/10 dark:ring-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 ring-rose-200 text-rose-700 dark:bg-rose-900/10 dark:ring-rose-800 dark:text-rose-300",
                  ].join(" ")}
                >
                  Net:{" "}
                  <b className="ml-1">
                    {(stats.net >= 0 ? "+" : "-") +
                      Math.abs(stats.net).toFixed(2)}
                  </b>
                </span>
              </div>

              <button
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenAcc((s) => ({ ...s, [key]: !isOpen }));
                }}
                aria-label={isOpen ? "Replier le groupe" : "Déplier le groupe"}
              >
                {isOpen ? (
                  <>
                    Replier <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Déplier <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </header>

            {/* body */}
            {isOpen && (
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((e) => {
                  const d = e.date || e.createdAt.slice(0, 10);
                  const dateFmt = (() => {
                    try {
                      const dt = new Date(
                        e.date ? `${e.date}T00:00:00` : e.createdAt
                      );
                      return dt.toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });
                    } catch {
                      return d;
                    }
                  })();

                  const pnl = n2(e.resultMoney);
                  const pnlTone =
                    Number.isFinite(pnl) && pnl !== 0
                      ? pnl > 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                      : "text-slate-700 dark:text-slate-200";

                  return (
                    <article
                      key={e.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          <span className="font-semibold">{dateFmt}</span>
                          {e.marketName && (
                            <>
                              <span className="mx-2">•</span>
                              <span title="Marché">{e.marketName}</span>
                            </>
                          )}
                          {e.strategyName && (
                            <>
                              <span className="mx-2">•</span>
                              <span title="Stratégie">{e.strategyName}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(e)}
                            className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Modifier"
                            aria-label="Modifier le journal"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onAskDelete(e)}
                            className="h-8 w-8 grid place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
                            title="Supprimer"
                            aria-label="Supprimer le journal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 space-y-3">
                        {(e.imageDataUrl || e.imageUrl) && (
                          <img
                            src={e.imageDataUrl || e.imageUrl}
                            alt="Illustration du trade"
                            className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            loading="lazy"
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                            Ordre: <b className="ml-1">{e.order || "—"}</b>
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                            Lot: <b className="ml-1">{e.lot || "—"}</b>
                          </span>
                          <span
                            className={[
                              "inline-flex items-center px-2 py-1 rounded-md ring-1",
                              e.result === "Gain"
                                ? "bg-emerald-50 ring-emerald-200 text-emerald-700 dark:bg-emerald-900/10 dark:ring-emerald-800 dark:text-emerald-300"
                                : e.result === "Perte"
                                ? "bg-rose-50 ring-rose-200 text-rose-700 dark:bg-rose-900/10 dark:ring-rose-800 dark:text-rose-300"
                                : "bg-slate-50 ring-slate-200 text-slate-700 dark:bg-slate-800/60 dark:ring-slate-700 dark:text-slate-300",
                            ].join(" ")}
                          >
                            Résultat: <b className="ml-1">{e.result || "—"}</b>
                          </span>

                          {/* UT / Session si présents */}
                          {e.timeframes && e.timeframes.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                              UT:{" "}
                              <b className="ml-1">{e.timeframes.join("/")}</b>
                            </span>
                          )}
                          {e.session && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                              Session: <b className="ml-1">{e.session}</b>
                            </span>
                          )}

                          {e.detail && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700">
                              {e.detail}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="rounded-lg p-2 bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:ring-emerald-800">
                            <div className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                              Investi
                            </div>
                            <div className="font-semibold">
                              {e.invested || "—"}
                            </div>
                          </div>
                          <div className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                            <div className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                              Résultat (dev.)
                            </div>
                            <div
                              className={`font-semibold tabular-nums ${pnlTone}`}
                            >
                              {e.resultMoney || "—"}
                            </div>
                          </div>
                          <div className="rounded-lg p-2 bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                            <div className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                              Résultat %
                            </div>
                            <div className="font-semibold">
                              {e.resultPct || "—"}
                            </div>
                          </div>
                        </div>

                        {e.comment && (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                            {e.comment}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
