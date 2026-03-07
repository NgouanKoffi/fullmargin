import { useState } from "react";
import { X, Save } from "lucide-react";

export default function StrategyForm({
  editing,
  onSubmit,
  onCancel,
}: {
  editing: { name: string; description?: string } | null;
  onSubmit: (payload: { name: string; description?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">
          {editing ? "Modifier la stratégie" : "Créer une stratégie"}
        </h4>
        <button
          onClick={onCancel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onSubmit({
            name: trimmed,
            description: description.trim() || undefined,
          });
        }}
        className="mt-3 space-y-3"
      >
        <div>
          <label className="text-xs font-medium uppercase text-slate-500">
            Nom
          </label>
          <input
            autoFocus
            type="text"
            placeholder="Ex: Breakout M15"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase text-slate-500">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Setup / règles / gestion de position…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Save className="w-4 h-4" /> {editing ? "Enregistrer" : "Créer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" /> Quitter
          </button>
        </div>
      </form>
    </div>
  );
}
