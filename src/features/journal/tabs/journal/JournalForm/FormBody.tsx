// src/pages/journal/tabs/journal/JournalForm/FormBody.tsx
import { Image as ImageIcon, X } from "lucide-react";
import type { Option, JournalEntry } from "../../../types";
import {
  DETAIL_OPTIONS,
  DURATION_OPTIONS,
  ORDRE_OPTIONS,
  RESPECT_OPTIONS,
  RESULT_OPTIONS,
  TF_OPTIONS,
  SESSION_OPTIONS,
} from "../../../types";
import { SelectField, DateField } from "./Fields";
import { filterDecimal } from "./helpers";
import type { JournalEntryExt } from "./useJournalFormState";

type FormBodyProps = {
  accounts: Option[];
  markets: Option[];
  strats: Option[];
  state: JournalEntryExt;
  setField: <K extends keyof JournalEntryExt>(
    key: K,
    value: JournalEntryExt[K]
  ) => void;
  isLoss: boolean;
  isGain: boolean;
  isNull: boolean;
  moneyMsg: string;
  handleResultMoneyChange: (raw: string) => void;
  addImages: (files: FileList | null) => Promise<void>;
  removeImage: (idx: number) => void;
};

export function FormBody({
  accounts,
  markets,
  strats,
  state,
  setField,
  isLoss,
  isGain,
  isNull,
  moneyMsg,
  handleResultMoneyChange,
  addImages,
  removeImage,
}: FormBodyProps) {
  return (
    <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
      {/* Compte */}
      <SelectField
        label="Compte"
        required
        value={state.accountId}
        onChange={(id) => {
          const name = accounts.find((a) => a.id === id)?.name || "";
          setField("accountId", id);
          setField("accountName", name);
        }}
        options={accounts}
      />

      {/* Marché */}
      <SelectField
        label="Marché"
        required
        value={state.marketId}
        onChange={(id) => {
          const name = markets.find((m) => m.id === id)?.name || "";
          setField("marketId", id);
          setField("marketName", name);
        }}
        options={markets}
      />

      {/* Stratégie */}
      <SelectField
        label="Stratégie"
        required
        value={state.strategyId}
        onChange={(id) => {
          const name = strats.find((s) => s.id === id)?.name || "";
          setField("strategyId", id);
          setField("strategyName", name);
        }}
        options={strats}
      />

      {/* Ordre */}
      <div>
        <label className="text-sm font-medium">Ordre *</label>
        <select
          value={state.order}
          onChange={(e) =>
            setField("order", e.target.value as JournalEntry["order"])
          }
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 text-sm"
        >
          <option value="">Sélectionner…</option>
          {ORDRE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Lot */}
      <div>
        <label className="text-sm font-medium">Total de lot</label>
        <input
          type="text"
          inputMode="decimal"
          value={state.lot}
          onChange={(e) => setField("lot", filterDecimal(e.target.value, 4))}
          onBlur={() => {
            const v = (state.lot || "").replace(",", ".").replace(/\.$/, "");
            setField("lot", v);
          }}
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        />
      </div>

      {/* Résultat */}
      <div>
        <label className="text-sm font-medium">Résultat *</label>
        <select
          value={state.result}
          onChange={(e) =>
            setField("result", e.target.value as JournalEntry["result"])
          }
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        >
          <option value="">Sélectionner…</option>
          {RESULT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Détail */}
      <div>
        <label className="text-sm font-medium">Détail</label>
        <select
          value={state.detail}
          onChange={(e) => setField("detail", e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        >
          <option value="">-- Sélectionner un détail --</option>
          {DETAIL_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Investi */}
      <div>
        <label className="text-sm font-medium">Montant investi *</label>
        <input
          type="text"
          inputMode="decimal"
          value={state.invested}
          onChange={(e) =>
            setField("invested", filterDecimal(e.target.value, 2))
          }
          onBlur={() => {
            const v = (state.invested || "")
              .replace(",", ".")
              .replace(/\.$/, "");
            setField("invested", v);
          }}
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        />
      </div>

      {/* Résultat (devise) */}
      <div>
        <label className="text-sm font-medium">Résultat (Devise) *</label>
        <input
          type="text"
          inputMode="decimal"
          value={state.resultMoney}
          onChange={(e) => {
            const raw = e.target.value;
            // ✅ On garde : chiffres, virgule, point, moins
            const cleaned = raw.replace(/[^\d.,-]/g, "");
            handleResultMoneyChange(cleaned);
          }}
          disabled={isNull}
          className={[
            "mt-1 w-full h-10 rounded-md border px-2 text-sm",
            isNull
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-white dark:bg-slate-900",
          ].join(" ")}
        />
        <div
          className={`mt-1 text-[12px] ${
            isLoss
              ? "text-rose-700 dark:text-rose-300"
              : isGain
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-slate-500"
          }`}
        >
          {moneyMsg}
        </div>
      </div>

      {/* % */}
      <div>
        <label className="text-sm font-medium">Résultat en %</label>
        <input
          value={state.resultPct}
          readOnly
          disabled
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 text-sm"
        />
      </div>

      {/* Respect */}
      <div>
        <label className="text-sm font-medium">
          Respect strict de la stratégie
        </label>
        <select
          value={state.respect}
          onChange={(e) =>
            setField("respect", e.target.value as JournalEntry["respect"])
          }
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        >
          <option value="">-- Sélectionner --</option>
          {RESPECT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Durée */}
      <div>
        <label className="text-sm font-medium">Durée</label>
        <select
          value={state.duration}
          onChange={(e) => setField("duration", e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        >
          <option value="">-- Sélectionner une durée --</option>
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* UT */}
      <div>
        <label className="text-sm font-medium">Unités de temps analysées</label>
        <div className="mt-1 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TF_OPTIONS.map((tf) => {
            const checked = (state.timeframes || []).includes(tf);
            return (
              <label
                key={tf}
                className={[
                  "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm ring-1 cursor-pointer select-none",
                  checked
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-slate-300 dark:ring-slate-700",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setField(
                      "timeframes",
                      on
                        ? [...(state.timeframes || []), tf]
                        : (state.timeframes || []).filter(
                            (t: string) => t !== tf
                          )
                    );
                  }}
                />
                {tf}
              </label>
            );
          })}
        </div>
      </div>

      {/* Session */}
      <div>
        <label className="text-sm font-medium">Session</label>
        <select
          value={state.session}
          onChange={(e) =>
            setField("session", e.target.value as JournalEntry["session"])
          }
          className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
        >
          <option value="">-- Sélectionner --</option>
          {SESSION_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Images */}
      <div>
        <label className="text-sm font-medium">
          Images (facultatif) — {state.images?.length || 0}/5
        </label>
        <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-6 text-sm">
          <ImageIcon className="w-4 h-4" />
          <span>Ajouter des images… (max 5)</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            multiple
            onChange={async (e) => {
              const input = e.currentTarget;
              const files = input.files;
              await addImages(files);
              if (input) {
                input.value = "";
              }
            }}
          />
        </label>
        {(state.images || []).length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(state.images || []).map((src, idx) => (
              <div key={idx} className="relative">
                <img
                  src={src}
                  className="w-full h-24 object-cover rounded-lg border"
                  alt=""
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 inline-flex items-center justify-center h-7 w-7 rounded-md border border-rose-200 text-rose-600 bg-white/90 hover:bg-rose-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commentaire */}
      <div>
        <label className="text-sm font-medium">Commentaire</label>
        <textarea
          rows={3}
          value={state.comment}
          onChange={(e) => setField("comment", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm"
        />
      </div>

      {/* Date */}
      <DateField
        label="Date"
        value={state.date}
        onChange={(v) => setField("date", v)}
      />
    </div>
  );
}
