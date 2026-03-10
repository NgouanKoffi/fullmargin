import { useState } from "react";
import type { Currency } from "../../../types";
import type { Account } from "../../../api";

type FormState = {
  name: string;
  initial: string;
  description: string;
};

const emptyForm: FormState = {
  name: "",
  initial: "",
  description: "",
};

// petit helper local : on garde seulement chiffres + . + , + espaces
function cleanDecimalInput(raw: string) {
  // on autorise : chiffres, virgule, point, espace (pour "5 000")
  let v = raw.replace(/[^0-9.,\s]/g, "");
  // pas plus d'un point/virgule pour éviter "12.3.4"
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/[.,]/g, ""); // on supprime les autres séparateurs
  }
  return v;
}

export default function AccountForm({
  initial,
  defaultCurrency, // ← devise globale passée par le parent
  onSave,
  onCancel,
}: {
  initial?: Account | null;
  defaultCurrency: Currency;
  onSave: (
    payload: Partial<Account> & {
      name: string;
      initial: number;
      description?: string;
      /** Optionnel: laissé vide en édition, forcé à la création */
      currency?: Currency;
    }
  ) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          initial: String(initial.initial),
          description: initial.description || "",
        }
      : emptyForm
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(
      String(form.initial).replace(/\s/g, "").replace(",", ".")
    );

    onSave({
      id: initial?.id,
      createdAt: initial?.createdAt,
      name: form.name.trim(),
      initial: Number.isFinite(val) ? val : 0,
      description: form.description.trim(),
      // 👉 à la création, on injecte la devise globale
      currency: initial ? undefined : defaultCurrency,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">
            Nom du compte
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Compte Forex XM"
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">
          Solde initial
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={form.initial}
          onChange={(e) =>
            setForm({
              ...form,
              initial: cleanDecimalInput(e.target.value),
            })
          }
          placeholder="Ex: 5000"
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">
          Description
        </label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ex: Compte d'expérimentation, scalping indices…"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
        />
      </div>

      {/* Petit rappel (lecture seule) */}
      {!initial && (
        <p className="text-xs text-slate-500">
          La devise du nouveau compte sera <b>{defaultCurrency}</b> (héritée de
          la devise globale).
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Quitter
        </button>
        <button
          type="submit"
          className="h-10 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 inline-flex items-center gap-2"
        >
          <span></span> Enregistrer
        </button>
      </div>
    </form>
  );
}
