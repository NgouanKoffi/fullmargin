// src/pages/journal/tabs/journal/JournalTable/index.tsx
import { useCallback, useMemo, useState } from "react";
import { Pencil, Trash2, CheckSquare, Square, X } from "lucide-react";
import type {
  Id,
  JournalEntry,
  Currency,
  ResultValue,
  RespectValue,
  SessionValue,
} from "../../../types";
import {
  DETAIL_OPTIONS,
  DURATION_OPTIONS,
  RESPECT_OPTIONS,
  RESULT_OPTIONS,
  SESSION_OPTIONS,
} from "../../../types";
import {
  EditableText,
  EditableNumber,
  EditableMoney,
  EditableDate,
  EditableSelect,
  EditableSelectKV,
} from "./EditableCells";
import { fmt2, getImagesOfEntry } from "./helpers";
import { Lightbox, type LightboxState } from "./Lightbox";
import { useJournalOptions } from "../JournalForm/OptionsLoader";

type Props = {
  items: JournalEntry[];
  displayCurrency: Currency;
  onEdit?: (e: JournalEntry) => void;
  onAskDelete: (e: JournalEntry) => void;
  onBulkDelete?: (entries: JournalEntry[]) => void;
  onQuickUpdate?: (id: Id, patch: Partial<JournalEntry>) => void;
};

export default function JournalTable({
  items,
  displayCurrency,
  onEdit,
  onAskDelete,
  onBulkDelete,
  onQuickUpdate,
}: Props) {
  const canQuickEdit = typeof onQuickUpdate === "function";
  const [lightbox, setLightbox] = useState<LightboxState>({ open: false });

  // État de sélection pour la suppression en masse
  const [selected, setSelected] = useState<Set<Id>>(new Set());

  // modal commentaire
  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    entry: JournalEntry | null;
    value: string;
  }>({
    open: false,
    entry: null,
    value: "",
  });

  const { accounts, markets, strats } = useJournalOptions();

  const urlsById = useMemo(() => {
    const map = new Map<Id, string[]>();
    for (const e of items) map.set(e.id, getImagesOfEntry(e));
    return map;
  }, [items]);

  const getUrls = useCallback((id: Id) => urlsById.get(id) || [], [urlsById]);

  const openAt = (entryId: Id, index: number) =>
    setLightbox({ open: true, entryId, index });

  const setLightboxIndex = (n: number) => {
    if (!lightbox.open) return;
    const urls = getUrls(lightbox.entryId);
    const next = Math.max(0, Math.min(n, Math.max(0, urls.length - 1)));
    setLightbox({ open: true, entryId: lightbox.entryId, index: next });
  };

  const commit = (row: JournalEntry, patch: Partial<JournalEntry>) => {
    if (!canQuickEdit) return;
    onQuickUpdate!(row.id, patch);
  };

  // Fonctions de sélection
  const toggleSelect = useCallback((id: Id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === items.length && items.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((e) => e.id)));
    }
  }, [selected.size, items]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const selectedEntries = useMemo(() => {
    return items.filter((e) => selected.has(e.id));
  }, [items, selected]);

  return (
    <>
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden relative">
        {/* Zone de défilement horizontal */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1200px]">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider font-bold">
              <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                <th className="py-3 px-3 text-center w-12 sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center w-5 h-5 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {selected.size === items.length && items.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                {[
                  "Date",
                  "Compte",
                  "Marché",
                  "Stratégie",
                  "Ordre",
                  "Lot",
                  "Investi",
                  "Résultat",
                  "Devise",
                  "Détail",
                  "Respect",
                  "Durée",
                  "UT",
                  "Session",
                  "Commentaire",
                  "Images",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-3 border-b border-slate-200 dark:border-slate-800 text-center whitespace-nowrap font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="py-12 px-3 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-900/10"
                  >
                    Aucun journal enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((e) => {
                  const urls = getUrls(e.id);
                  const tf = (e.timeframes || []).join(",");
                  const isSelected = selected.has(e.id);

                  return (
                    <tr
                      key={e.id}
                      className={cx(
                        "transition-colors group",
                        isSelected
                          ? "bg-emerald-50/50 dark:bg-emerald-500/5"
                          : "hover:bg-slate-50 dark:hover:bg-white/5",
                      )}
                    >
                      <td
                        className={cx(
                          "py-3 px-3 text-center sticky left-0 z-10 border-r border-slate-200/60 dark:border-slate-800/60",
                          isSelected
                            ? "bg-emerald-50 dark:bg-[#1a2e21]"
                            : "bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSelect(e.id)}
                          className={cx(
                            "inline-flex items-center justify-center w-5 h-5 transition-colors",
                            isSelected
                              ? "text-emerald-500"
                              : "text-slate-300 group-hover:text-slate-400",
                          )}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableDate
                          value={e.date}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { date: v })}
                          width={110}
                        />
                      </td>

                      <td className="py-3 px-3 text-center min-w-[160px] border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelectKV
                          value={e.accountId || ""}
                          options={accounts}
                          canEdit={canQuickEdit}
                          onCommit={(opt) =>
                            commit(e, {
                              accountId: opt.id,
                              accountName: opt.name,
                            })
                          }
                          width={160}
                        />
                      </td>

                      <td className="py-3 px-3 text-center min-w-[140px] border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelectKV
                          value={e.marketId || ""}
                          options={markets}
                          canEdit={canQuickEdit}
                          onCommit={(opt) =>
                            commit(e, {
                              marketId: opt.id,
                              marketName: opt.name,
                            })
                          }
                          width={140}
                        />
                      </td>

                      <td className="py-3 px-3 text-center min-w-[150px] border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelectKV
                          value={e.strategyId || ""}
                          options={strats}
                          canEdit={canQuickEdit}
                          onCommit={(opt) =>
                            commit(e, {
                              strategyId: opt.id,
                              strategyName: opt.name,
                            })
                          }
                          width={150}
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelect
                          value={e.order}
                          options={["Buy", "Sell"]}
                          canEdit={canQuickEdit}
                          onCommit={(v) =>
                            commit(e, { order: v as "Buy" | "Sell" | "" })
                          }
                          width={80}
                          className={
                            e.order === "Buy"
                              ? "text-emerald-500 font-bold justify-center"
                              : "text-rose-500 font-bold justify-center"
                          }
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableNumber
                          value={e.lot}
                          onCommit={(v) => commit(e, { lot: v })}
                          canEdit={canQuickEdit}
                          decimals={4}
                          width={70}
                          className="mx-auto"
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableMoney
                          value={e.invested}
                          currency={displayCurrency}
                          onCommit={(v) => {
                            const inv = Number(v.replace(",", "."));
                            const res = Number(
                              String(e.resultMoney || "").replace(",", "."),
                            );
                            const patch: Partial<JournalEntry> = {
                              invested: v,
                            };
                            if (
                              Number.isFinite(inv) &&
                              inv !== 0 &&
                              Number.isFinite(res)
                            )
                              patch.resultPct = fmt2((res / inv) * 100);
                            commit(e, patch);
                          }}
                          canEdit={canQuickEdit}
                          decimals={2}
                          width={100}
                          className="mx-auto"
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50 font-semibold">
                        <EditableSelect
                          value={e.result}
                          options={[...RESULT_OPTIONS]}
                          canEdit={canQuickEdit}
                          onCommit={(v) => {
                            const patch: Partial<JournalEntry> = {
                              result: v as ResultValue,
                            };
                            const money = String(e.resultMoney || "").trim();
                            if (v === "Perte" && money)
                              patch.resultMoney = money.startsWith("-")
                                ? money
                                : `-${money.replace(/^-/, "")}`;
                            if (v === "Gain" && money)
                              patch.resultMoney = money.replace(/-/g, "");
                            if (v === "Nul") {
                              patch.resultMoney = "0";
                              patch.resultPct = "0.00";
                            }
                            commit(e, patch);
                          }}
                          width={90}
                          className={
                            e.result === "Gain"
                              ? "text-emerald-500 justify-center"
                              : e.result === "Perte"
                                ? "text-rose-500 justify-center"
                                : "justify-center"
                          }
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableMoney
                          value={e.resultMoney}
                          currency={displayCurrency}
                          onCommit={(raw) => {
                            let v = raw;
                            if (e.result === "Nul") v = "0";
                            else if (e.result === "Perte")
                              v = v.startsWith("-")
                                ? v
                                : `-${v.replace(/^-/, "")}`;
                            else if (e.result === "Gain")
                              v = v.replace(/-/g, "");

                            const inv = Number(
                              String(e.invested || "").replace(",", "."),
                            );
                            const res = Number(String(v).replace(",", "."));
                            const patch: Partial<JournalEntry> = {
                              resultMoney: v,
                            };
                            if (
                              Number.isFinite(inv) &&
                              inv !== 0 &&
                              Number.isFinite(res)
                            )
                              patch.resultPct = fmt2((res / inv) * 100);
                            commit(e, patch);
                          }}
                          canEdit={canQuickEdit}
                          decimals={2}
                          allowNegative
                          width={100}
                          className="mx-auto"
                          negativeClass="text-rose-600 font-bold tabular-nums"
                          positiveClass="text-emerald-600 font-bold tabular-nums"
                        />
                      </td>

                      <td className="py-3 px-3 text-center min-w-[140px] border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelect
                          value={e.detail || ""}
                          options={[...DETAIL_OPTIONS]}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { detail: v })}
                          width={140}
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelect
                          value={e.respect || ""}
                          options={[...RESPECT_OPTIONS]}
                          canEdit={canQuickEdit}
                          onCommit={(v) =>
                            commit(e, { respect: v as RespectValue })
                          }
                          width={110}
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelect
                          value={e.duration || ""}
                          options={[...DURATION_OPTIONS]}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { duration: v })}
                          width={140}
                        />
                      </td>

                      <td className="py-3 px-3 text-center min-w-[120px] border-r border-slate-100 dark:border-slate-800/50">
                        <EditableText
                          value={tf}
                          onCommit={(txt) =>
                            commit(e, {
                              timeframes: txt
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            })
                          }
                          canEdit={canQuickEdit}
                          width={120}
                        />
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        <EditableSelect
                          value={
                            SESSION_OPTIONS.find((s) => s.value === e.session)
                              ?.label || ""
                          }
                          options={SESSION_OPTIONS.map((s) => s.label)}
                          canEdit={canQuickEdit}
                          onCommit={(label) =>
                            commit(e, {
                              session: SESSION_OPTIONS.find(
                                (s) => s.label === label,
                              )?.value as SessionValue,
                            })
                          }
                          width={110}
                        />
                      </td>

                      <td className="py-3 px-3 text-center max-w-[200px] border-r border-slate-100 dark:border-slate-800/50">
                        <button
                          type="button"
                          onClick={() =>
                            setCommentModal({
                              open: true,
                              entry: e,
                              value: e.comment || "",
                            })
                          }
                          className="w-full inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs truncate hover:bg-slate-200 transition-colors"
                          title={e.comment || "Ajouter un commentaire"}
                        >
                          {e.comment || "..."}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                        {urls.length > 0 ? (
                          <div className="flex justify-center gap-1">
                            {urls.slice(0, 2).map((u, i) => (
                              <button
                                key={i}
                                onClick={() => openAt(e.id, i)}
                                className="h-8 w-12 rounded border border-slate-200 overflow-hidden"
                              >
                                <img
                                  src={u}
                                  className="h-full w-full object-cover"
                                  alt=""
                                />
                              </button>
                            ))}
                            {urls.length > 2 && (
                              <span className="text-[10px] self-center">
                                +{urls.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3 px-3 text-center sticky right-0 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-1.5 justify-center">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(e)}
                              className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onAskDelete(e)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ BARRE DE SÉLECTION FLOTTANTE (COMPACTE, ARRONDIE, EN BAS) */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-max bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-1.5 pr-2.5 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center gap-2 pl-2">
            <span className="flex items-center justify-center min-w-[24px] h-6 bg-emerald-600 rounded-full text-xs font-bold ring-2 ring-emerald-500/20 px-1.5">
              {selected.size}
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap hidden sm:inline-block">
              {selected.size > 1
                ? "Entrées sélectionnées"
                : "Entrée sélectionnée"}
            </span>
            <span className="text-xs font-semibold tracking-tight whitespace-nowrap sm:hidden">
              Sélection
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 ml-1">
            {onBulkDelete && (
              <button
                type="button"
                onClick={() => onBulkDelete(selectedEntries)}
                className="inline-flex items-center justify-center p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all active:scale-95 shadow-md shadow-rose-600/20"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Annuler la sélection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS (Lightbox, Commentaire) */}
      <Lightbox
        state={lightbox}
        onClose={() => setLightbox({ open: false })}
        getUrls={getUrls}
        setIndex={setLightboxIndex}
      />

      {commentModal.open && commentModal.entry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Note de trading</h3>
            <textarea
              value={commentModal.value}
              onChange={(e) =>
                setCommentModal((p) => ({ ...p, value: e.target.value }))
              }
              rows={5}
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border-none p-4 text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Décrivez votre trade..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setCommentModal({ open: false, entry: null, value: "" })
                }
                className="px-5 py-2 text-sm font-bold text-slate-500"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (commentModal.entry)
                    onQuickUpdate?.(commentModal.entry.id, {
                      comment: commentModal.value,
                    });
                  setCommentModal({ open: false, entry: null, value: "" });
                }}
                className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function cx(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
