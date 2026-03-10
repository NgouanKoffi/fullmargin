// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\projets\composants\ProjectCreateForm.tsx
import React, { useMemo, useState } from "react";

const NAME_MAX = 40; // limite nom
const DESC_MAX = 240; // limite description

export type ProjectCreatePayload = {
  name: string;
  description: string;
  color: string; // hex (#RRGGBB)
};

const PRESET_COLORS = [
  "#7C3AED", // violet-600
  "#4F46E5", // indigo-600
  "#0EA5E9", // sky-500
  "#06B6D4", // cyan-500
  "#10B981", // emerald-500
  "#22C55E", // green-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#DB2777", // fuchsia-600
  "#111827", // gray-900
];

function sanitizeHex(input: string): string {
  let s = input.trim().toUpperCase();
  if (!s.startsWith("#")) s = "#" + s;
  s = s.slice(0, 7); // # + 6
  if (!/^#[0-9A-F]{0,6}$/.test(s)) {
    s = "#" + s.replace(/[^0-9A-F]/g, "").slice(0, 6);
  }
  if (s === "#") s = "#7C3AED";
  return s;
}

const INPUT_BASE =
  "rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 " +
  "border border-slate-300 dark:border-slate-700 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-500";

const INPUT_SM =
  "rounded-md px-2 py-2 bg-white dark:bg-neutral-900 " +
  "border border-slate-300 dark:border-slate-700 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-500";

export default function ProjectCreateForm({
  onCreate,
  onCancel,
  initial,
}: {
  onCreate: (payload: ProjectCreatePayload) => void;
  onCancel: () => void;
  initial?: Partial<ProjectCreatePayload>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(sanitizeHex(initial?.color ?? "#7C3AED"));

  const disabled = useMemo(
    () =>
      !name.trim() ||
      name.trim().length > NAME_MAX ||
      description.length > DESC_MAX ||
      !/^#[0-9A-F]{6}$/.test(color),
    [name, description, color]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      color,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      {/* Nom */}
      <div className="grid gap-2">
        <label className="text-sm opacity-70" htmlFor="proj-name">
          Nom du projet
        </label>
        <input
          id="proj-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          placeholder="Mon super projet"
          required
          className={INPUT_BASE}
        />
        <div className="text-xs opacity-60">
          {name.length}/{NAME_MAX}
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <label className="text-sm opacity-70" htmlFor="proj-desc">
          Description
        </label>
        <textarea
          id="proj-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
          maxLength={DESC_MAX}
          placeholder="But, contexte, livrables…"
          className={INPUT_BASE}
        />
        <div className="text-xs opacity-60">
          {description.length}/{DESC_MAX}
        </div>
      </div>

      {/* Couleur */}
      <div className="grid gap-3">
        <label className="text-sm opacity-70">Couleur</label>

        {/* Aperçu */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm opacity-70">Aperçu</span>
          <span
            className="ml-auto rounded-full px-3 py-1 text-xs border border-slate-300 dark:border-slate-700"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,.03), rgba(0,0,0,0))",
            }}
          >
            {color}
          </span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-10 gap-2">
          {PRESET_COLORS.map((c) => {
            const active = c === color;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`aspect-square rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  active
                    ? "outline outline-2 outline-offset-2 outline-indigo-500"
                    : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Choisir ${c}`}
                aria-pressed={active}
                title={c}
              />
            );
          })}
        </div>

        {/* Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(sanitizeHex(e.target.value))}
            className="h-10 w-14 rounded-md border border-slate-300 dark:border-slate-700 p-0"
            aria-label="Sélecteur de couleur"
          />
          <input
            value={color}
            onChange={(e) => setColor(sanitizeHex(e.target.value))}
            placeholder="#7C3AED"
            className={`w-[120px] ${INPUT_SM} text-sm`}
            aria-label="Code hexadécimal"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={disabled}
          className={`rounded-xl px-4 py-2 text-white ${
            disabled
              ? "bg-indigo-400/60 cursor-not-allowed"
              : "bg-indigo-600 hover:opacity-90"
          }`}
        >
          Créer
        </button>
      </div>
    </form>
  );
}
