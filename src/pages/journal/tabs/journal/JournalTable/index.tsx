// src/pages/journal/tabs/journal/JournalTable/index.tsx
import { useCallback, useMemo, useState } from "react";
import { Pencil, Trash2, CheckSquare, Square } from "lucide-react";
import type { Id, JournalEntry, Currency } from "../../../types";
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
  
  // ✅ Selection state for bulk delete
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

  // ✅ Selection functions
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
      {/* conteneur principal avec thème propre */}
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        {/* zone déroulable uniquement pour la table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1100px]">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wide">
              <tr>
                {/* ✅ Checkbox column for select all */}
                <th className="py-3 px-3 border-b border-slate-200 dark:border-slate-800 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-700/50 w-12">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title={
                      selected.size === items.length && items.length > 0
                        ? "Tout désélectionner"
                        : "Tout sélectionner"
                    }
                  >
                    {selected.size === items.length && items.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
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
                    className="py-3 px-3 border-b border-slate-200 dark:border-slate-800 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="py-6 px-3 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30"
                  >
                    Aucun journal.
                  </td>
                </tr>
              ) : (
                items.map((e, idx) => {
                  const urls = getUrls(e.id);
                  const tf = (e.timeframes || []).join(",");
                  const isEven = idx % 2 === 0;
                  const isSelected = selected.has(e.id);

                  return (
                    <tr
                      key={e.id}
                      className={[
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                          : isEven
                          ? "bg-white dark:bg-slate-900/20"
                          : "bg-slate-50 dark:bg-slate-900/5",
                        isSelected
                          ? "border-b border-emerald-200 dark:border-emerald-700"
                          : "border-b border-slate-200/70 dark:border-slate-800/50",
                        "hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors",
                      ].join(" ")}
                    >
                      {/* ✅ Checkbox cell */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => toggleSelect(e.id)}
                          className="inline-flex items-center justify-center w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title={isSelected ? "Désélectionner" : "Sélectionner"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      {/* Date */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableDate
                          value={e.date}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { date: v })}
                          width={130}
                        />
                      </td>

                      {/* Compte */}
                      <td className="py-3 px-3 text-center min-w-[160px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
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
                          width={180}
                          className="mx-auto"
                        />
                      </td>

                      {/* Marché */}
                      <td className="py-3 px-3 text-center min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
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
                          width={160}
                          className="mx-auto"
                        />
                      </td>

                      {/* Stratégie */}
                      <td className="py-3 px-3 text-center min-w-[150px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
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
                          width={170}
                          className="mx-auto"
                        />
                      </td>

                      {/* Ordre */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={e.order}
                          options={["Buy", "Sell"]}
                          canEdit={canQuickEdit}
                          onCommit={(v) =>
                            commit(e, { order: v as JournalEntry["order"] })
                          }
                          width={90}
                          className={
                            e.order === "Buy"
                              ? "text-emerald-500 dark:text-emerald-300 justify-center"
                              : e.order === "Sell"
                              ? "text-rose-500 dark:text-rose-300 justify-center"
                              : "justify-center"
                          }
                        />
                      </td>

                      {/* Lot */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableNumber
                          value={e.lot}
                          onCommit={(v) => commit(e, { lot: v })}
                          canEdit={canQuickEdit}
                          decimals={4}
                          allowNegative={false}
                          width={70}
                          className="mx-auto text-slate-900 dark:text-slate-50"
                        />
                      </td>

                      {/* Investi */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableMoney
                          value={e.invested}
                          currency={displayCurrency}
                          onCommit={(v) => {
                            const inv = Number(v.replace(",", "."));
                            const res = Number(
                              String(e.resultMoney || "").replace(",", ".")
                            );
                            const patch: Partial<JournalEntry> = {
                              invested: v,
                            };
                            if (
                              Number.isFinite(inv) &&
                              inv !== 0 &&
                              Number.isFinite(res)
                            ) {
                              patch.resultPct = fmt2((res / inv) * 100);
                            }
                            commit(e, patch);
                          }}
                          canEdit={canQuickEdit}
                          decimals={2}
                          allowNegative={false}
                          width={110}
                          className="mx-auto text-center"
                        />
                      </td>

                      {/* Résultat */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={e.result}
                          options={RESULT_OPTIONS as unknown as string[]}
                          canEdit={canQuickEdit}
                          onCommit={(v) => {
                            const patch: Partial<JournalEntry> = {
                              result: v as JournalEntry["result"],
                            };
                            const money = String(e.resultMoney || "").trim();
                            if (v === "Perte" && money) {
                              const abs = money.replace(/^-/, "");
                              patch.resultMoney = /^(0+(\.0+)?)$/.test(abs)
                                ? "0"
                                : `-${abs}`;
                            }
                            if (v === "Gain" && money) {
                              patch.resultMoney = money.replace(/-/g, "");
                            }
                            if (v === "Nul") {
                              patch.resultMoney = "0";
                              patch.resultPct = "0.00";
                            }
                            commit(e, patch);
                          }}
                          width={90}
                          className={
                            e.result === "Gain"
                              ? "text-emerald-500 dark:text-emerald-300 justify-center"
                              : e.result === "Perte"
                              ? "text-rose-500 dark:text-rose-300 justify-center"
                              : "justify-center"
                          }
                        />
                      </td>

                      {/* Devise (résultat money) */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableMoney
                          value={e.resultMoney}
                          currency={displayCurrency}
                          onCommit={(raw) => {
                            let v = raw;
                            const isLoss = e.result === "Perte";
                            const isGain = e.result === "Gain";
                            const isNull = e.result === "Nul";

                            if (isNull) v = "0";
                            else if (isLoss) {
                              const abs = v.replace(/^-/, "");
                              v =
                                abs && !/^(0+(\.0+)?)$/.test(abs)
                                  ? `-${abs}`
                                  : "0";
                            } else if (isGain) {
                              v = v.replace(/-/g, "");
                            }

                            const inv = Number(
                              String(e.invested || "").replace(",", ".")
                            );
                            const res = Number(String(v).replace(",", "."));
                            const patch: Partial<JournalEntry> = {
                              resultMoney: v,
                            };
                            if (
                              Number.isFinite(inv) &&
                              inv !== 0 &&
                              Number.isFinite(res)
                            ) {
                              patch.resultPct = fmt2((res / inv) * 100);
                            } else if (isNull) {
                              patch.resultPct = "0.00";
                            }
                            commit(e, patch);
                          }}
                          canEdit={canQuickEdit}
                          decimals={2}
                          allowNegative={true}
                          width={110}
                          className="mx-auto text-center"
                          negativeClass="text-rose-500 dark:text-rose-300 font-medium tabular-nums"
                          positiveClass="text-slate-900 dark:text-slate-50 font-medium tabular-nums"
                        />
                      </td>

                      {/* Détail */}
                      <td className="py-3 px-3 text-center min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={e.detail || ""}
                          options={DETAIL_OPTIONS}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { detail: v })}
                          width={150}
                          className="mx-auto"
                        />
                      </td>

                      {/* Respect */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={e.respect || ""}
                          options={RESPECT_OPTIONS}
                          canEdit={canQuickEdit}
                          onCommit={(v) =>
                            commit(e, {
                              respect: v as JournalEntry["respect"],
                            })
                          }
                          width={110}
                          className="mx-auto"
                        />
                      </td>

                      {/* Durée */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={e.duration || ""}
                          options={DURATION_OPTIONS}
                          canEdit={canQuickEdit}
                          onCommit={(v) => commit(e, { duration: v })}
                          width={150}
                          className="mx-auto"
                        />
                      </td>

                      {/* UT */}
                      <td className="py-3 px-3 text-center min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
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
                          width={150}
                          className="mx-auto"
                        />
                      </td>

                      {/* Session */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <EditableSelect
                          value={
                            e.session === "london"
                              ? "London"
                              : e.session === "newyork"
                              ? "New York"
                              : e.session === "asiatique"
                              ? "Asiatique"
                              : ""
                          }
                          options={SESSION_OPTIONS.map((s) => s.label)}
                          canEdit={canQuickEdit}
                          onCommit={(label) => {
                            const opt = SESSION_OPTIONS.find(
                              (s) => s.label === label
                            );
                            commit(e, {
                              session: (opt?.value ||
                                "") as JournalEntry["session"],
                            });
                          }}
                          width={130}
                          className="mx-auto"
                        />
                      </td>

                      {/* Commentaire -> ouvre modal */}
                      <td className="py-3 px-3 text-center max-w-[240px] border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        <button
                          type="button"
                          onClick={() =>
                            setCommentModal({
                              open: true,
                              entry: e,
                              value: e.comment || "",
                            })
                          }
                          className="w-[220px] max-w-[220px] inline-flex items-center justify-center px-2 py-1 rounded-md bg-slate-200/60 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700/70 text-xs text-slate-900 dark:text-slate-100 truncate"
                          title={e.comment || "Ajouter un commentaire"}
                        >
                          {e.comment && e.comment.trim().length > 0
                            ? e.comment
                            : "Ajouter un commentaire…"}
                        </button>
                      </td>

                      {/* Images */}
                      <td className="py-3 px-3 text-center border-r border-slate-200/60 dark:border-slate-700/50 last:border-r-0">
                        {urls.length === 0 ? (
                          "—"
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {urls.slice(0, 2).map((u, i) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => openAt(e.id, i)}
                                className="relative h-9 w-14 rounded overflow-hidden border border-slate-300 dark:border-slate-600"
                                title="Voir"
                              >
                                <img
                                  src={u}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                            {urls.length > 2 && (
                              <button
                                type="button"
                                onClick={() => openAt(e.id, 2)}
                                className="h-9 w-14 rounded border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold"
                                title="Voir toutes les images"
                              >
                                +{urls.length - 2}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center last:border-r-0 border-r border-slate-200/60 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 justify-center">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(e)}
                              className="h-8 w-8 grid place-items-center rounded-md bg-emerald-500 hover:bg-emerald-400 text-white"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onAskDelete(e)}
                            className="h-8 w-8 grid place-items-center rounded-md bg-rose-500 hover:bg-rose-400 text-white"
                            title="Supprimer"
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

      {/* lightbox images */}
      <Lightbox
        state={lightbox}
        onClose={() => setLightbox({ open: false })}
        getUrls={getUrls}
        setIndex={setLightboxIndex}
      />

      {/* Modal commentaire */}
      {commentModal.open && commentModal.entry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold mb-3">
              Commentaire – {commentModal.entry.date} •{" "}
              {commentModal.entry.marketName ||
                commentModal.entry.marketId ||
                ""}
            </h3>
            <textarea
              value={commentModal.value}
              onChange={(e) =>
                setCommentModal((prev) => ({ ...prev, value: e.target.value }))
              }
              rows={6}
              className="w-full rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Saisir le commentaire détaillé…"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() =>
                  setCommentModal({ open: false, entry: null, value: "" })
                }
                className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!canQuickEdit || !onQuickUpdate || !commentModal.entry) {
                    setCommentModal({ open: false, entry: null, value: "" });
                    return;
                  }
                  onQuickUpdate(commentModal.entry.id, {
                    comment: commentModal.value,
                  });
                  setCommentModal({ open: false, entry: null, value: "" });
                }}
                className="px-4 py-2 rounded-md bg-emerald-500 text-white text-sm hover:bg-emerald-400"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bulk Action Bar - Compact top version */}
      {selected.size > 0 && (
        <div className="mb-3 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
            {selected.size} {selected.size === 1 ? "sélectionnée" : "sélectionnées"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="p-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
              title="Désélectionner tout"
            >
              <Square className="w-4 h-4" />
            </button>
            {onBulkDelete && (
              <button
                type="button"
                onClick={() => {
                  onBulkDelete(selectedEntries);
                  clearSelection();
                }}
                className="p-2 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
