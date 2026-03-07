// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\CategoriesTable.tsx
import { Trash2, Save, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminCategory, CreateCategoryBody } from "../api/types";
import SearchInput from "./ui/SearchInput";

type Props = {
  rows: AdminCategory[];
  q: string;
  setQ: (v: string) => void;
  onAdd: (payload: CreateCategoryBody) => void | Promise<void>;
  onUpdate: (
    key: string,
    patch: Partial<Pick<AdminCategory, "key" | "label" | "commissionPct">>
  ) => void | Promise<void>;
  onRemove: (key: string) => void | Promise<void>;
};

export default function CategoriesTable({
  rows,
  q,
  setQ,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (c) =>
        c.key.toLowerCase().includes(s) || c.label.toLowerCase().includes(s)
    );
  }, [rows, q]);

  // ------- création -------
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCommission, setNewCommission] = useState<number>(0);

  const creating =
    !newKey.trim() ||
    !newLabel.trim() ||
    rows.some((c) => c.key.toLowerCase() === newKey.trim().toLowerCase());

  const submitNew = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (creating) return;
    await onAdd({
      key: normKey(newKey),
      label: newLabel.trim(),
      commissionPct: clampPct(newCommission),
    });
    setNewKey("");
    setNewLabel("");
    setNewCommission(0);
  };

  // nombre de colonnes adaptatif pour éviter un gros trou à droite
  const colsClass =
    data.length <= 1
      ? "grid-cols-1"
      : data.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : data.length === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <section className="w-full rounded-2xl bg-white/70 dark:bg-neutral-900/60 ring-1 ring-black/10 dark:ring-white/10 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold">Catégories & Commissions</h2>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Rechercher une catégorie…"
        />
      </div>

      {/* Formulaire d’ajout (carte simple) */}
      <form
        onSubmit={submitNew}
        className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-2"
      >
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Clé (ex: robots)"
          className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nom affiché (ex: Robots)"
          className="rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={newCommission}
            onChange={(e) =>
              setNewCommission(parseFloat(e.target.value || "0"))
            }
            className="w-28 rounded-lg px-3 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
            placeholder="%"
            title="Commission (%)"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            title={
              creating
                ? "Renseignez une clé/nom valide, non utilisée"
                : "Ajouter la catégorie"
            }
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </form>

      {/* Grille de cartes */}
      <div className={`grid gap-4 ${colsClass}`}>
        {data.map((c) => (
          <Card
            key={c.id}
            cat={c}
            onSave={(patch) => onUpdate(c.key, patch)}
            onDelete={() => onRemove(c.key)}
          />
        ))}
        {data.length === 0 && (
          <div className="col-span-full py-10 text-center opacity-60">
            Aucune catégorie.
          </div>
        )}
      </div>
    </section>
  );
}

function Card({
  cat,
  onSave,
  onDelete,
}: {
  cat: AdminCategory;
  onSave: (
    patch: Partial<Pick<AdminCategory, "key" | "label" | "commissionPct">>
  ) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const [keyVal, setKeyVal] = useState(cat.key);
  const [labelVal, setLabelVal] = useState(cat.label);
  const [pctVal, setPctVal] = useState<number>(cat.commissionPct ?? 0);

  const productsCount =
    (cat as unknown as { productsCount?: number }).productsCount ?? 0;

  const dirty =
    keyVal !== cat.key ||
    labelVal !== cat.label ||
    pctVal !== cat.commissionPct;

  const save = () =>
    onSave({
      key: normKey(keyVal),
      label: labelVal.trim(),
      commissionPct: clampPct(pctVal),
    });

  return (
    <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-neutral-950 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] opacity-60">Clé</span>
        <span className="text-[11px] opacity-60">
          Produits: {productsCount}
        </span>
      </div>
      <input
        value={keyVal}
        onChange={(e) => setKeyVal(e.target.value)}
        className="w-full font-mono text-[12px] rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
      />

      <label className="text-[11px] opacity-60">Nom affiché</label>
      <input
        value={labelVal}
        onChange={(e) => setLabelVal(e.target.value)}
        className="w-full rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
      />

      <label className="text-[11px] opacity-60">Commission (%)</label>
      <input
        type="number"
        min={0}
        max={100}
        value={pctVal}
        onChange={(e) => setPctVal(parseFloat(e.target.value || "0"))}
        className="w-28 rounded-lg px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={save}
          disabled={!dirty}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
          title={
            dirty ? "Enregistrer les modifications" : "Aucune modification"
          }
        >
          <Save className="w-4 h-4" />
          Sauver
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                `Supprimer la catégorie "${cat.label}" ? (Produits existants : ${productsCount})`
              )
            ) {
              onDelete();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-rose-600 text-white hover:bg-rose-700"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}

/* helpers */
function normKey(s = "") {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}
function clampPct(n: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v * 100) / 100));
}
