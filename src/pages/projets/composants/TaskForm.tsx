// src/pages/projets/composants/TaskForm.tsx
import { useState } from "react";
import {
  CalendarDays,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Flag,
  Star,
  Bug,
  Wrench,
  Flame,
  Bell,
  Zap,
  Bookmark,
  MessageSquare,
  DollarSign,
  Globe,
  Rocket,
  Shield,
  Target,
  Trophy,
  type LucideIcon,
  X,
} from "lucide-react";
import type { Priorite, Statut, Tache } from "../types";

export type IconId =
  | "check"
  | "flag"
  | "star"
  | "bug"
  | "wrench"
  | "flame"
  | "bell"
  | "zap"
  | "bookmark"
  | "message"
  | "dollar"
  | "globe"
  | "rocket"
  | "shield"
  | "target"
  | "trophy";

const ICONS: {
  id: IconId;
  label: string;
  Icon: LucideIcon;
  lucideName: string;
}[] = [
  {
    id: "check",
    label: "Validation",
    Icon: CheckCircle2,
    lucideName: "CheckCircle2",
  },
  { id: "flag", label: "À signaler", Icon: Flag, lucideName: "Flag" },
  { id: "star", label: "Important", Icon: Star, lucideName: "Star" },
  { id: "bug", label: "Bug", Icon: Bug, lucideName: "Bug" },
  { id: "wrench", label: "Maintenance", Icon: Wrench, lucideName: "Wrench" },
  { id: "flame", label: "Urgent", Icon: Flame, lucideName: "Flame" },
  { id: "bell", label: "Rappel", Icon: Bell, lucideName: "Bell" },
  { id: "zap", label: "Rapide", Icon: Zap, lucideName: "Zap" },
  { id: "bookmark", label: "Marque", Icon: Bookmark, lucideName: "Bookmark" },
  {
    id: "message",
    label: "Discussion",
    Icon: MessageSquare,
    lucideName: "MessageSquare",
  },
  {
    id: "dollar",
    label: "Finance",
    Icon: DollarSign,
    lucideName: "DollarSign",
  },
  { id: "globe", label: "Web", Icon: Globe, lucideName: "Globe" },
  { id: "rocket", label: "Lancement", Icon: Rocket, lucideName: "Rocket" },
  { id: "shield", label: "Sécurité", Icon: Shield, lucideName: "Shield" },
  { id: "target", label: "Objectif", Icon: Target, lucideName: "Target" },
  { id: "trophy", label: "Succès", Icon: Trophy, lucideName: "Trophy" },
];

const ID_BY_LUCIDE: Record<string, IconId> = Object.fromEntries(
  ICONS.map((i) => [i.lucideName, i.id])
) as Record<string, IconId>;

export default function TaskForm({
  initial,
  onSave,
  onCancel,
  suggestedTags = [],
  onTagUsed,
  onTagDelete,
}: {
  initial?: Partial<Tache>;
  onSave: (payload: Partial<Tache>) => void;
  onCancel: () => void;
  suggestedTags?: string[];
  onTagUsed?: (tag: string) => void;
  /** ✅ nouvelle prop pour enlever un tag créé par l’utilisateur */
  onTagDelete?: (tag: string) => void;
}) {
  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [etiquette, setEtiquette] = useState(initial?.etiquette ?? "");
  const [priorite, setPriorite] = useState<Priorite>(
    initial?.priorite ?? "medium"
  );
  const [statut, setStatut] = useState<Statut>(initial?.statut ?? "todo");
  const [echeance, setEcheance] = useState(initial?.echeance ?? "");
  const [terminee, setTerminee] = useState(initial?.terminee ?? false);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const defaultIconId: IconId =
    (initial?.icone && ID_BY_LUCIDE[initial.icone]) || "check";
  const [iconId, setIconId] = useState<IconId>(defaultIconId);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  const inputBase =
    "w-full rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500";
  const areaBase = inputBase + " min-h-[110px]";
  const box =
    "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-neutral-900/70 p-3";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const icone =
          ICONS.find((i) => i.id === iconId)?.lucideName || "CheckCircle2";
        const tag = (etiquette || "").trim();
        if (tag && onTagUsed) {
          onTagUsed(tag);
        }
        onSave({
          titre,
          etiquette: tag,
          priorite,
          statut,
          echeance,
          terminee,
          imageUrl,
          notes,
          icone,
        });
      }}
      className="grid gap-4"
    >
      {/* Titre */}
      <div className="grid gap-2">
        <label className="text-sm opacity-70">Titre</label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          className={inputBase}
        />
      </div>

      {/* Bloc icône + étiquette + échéance */}
      <div className={box}>
        {/* Icône */}
        <div className="grid gap-2">
          <label className="text-sm opacity-70">Icône</label>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Icône de la tâche"
          >
            {ICONS.map(({ id, Icon, label }) => {
              const active = iconId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIconId(id)}
                  className={[
                    "relative rounded-lg flex items-center justify-center",
                    "w-9 h-9 md:w-10 md:h-10",
                    "border transition",
                    active
                      ? "border-indigo-500 ring-2 ring-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/10",
                  ].join(" ")}
                  title={label}
                  aria-checked={active}
                  role="radio"
                >
                  <Icon className={active ? "opacity-100" : "opacity-80"} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Étiquette + suggestions */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm opacity-70">Étiquette</label>
            <input
              list="project-task-tags"
              value={etiquette}
              onChange={(e) => setEtiquette(e.target.value)}
              placeholder="Ex. urgent, client X, sprint 12…"
              className={inputBase}
            />
            <datalist id="project-task-tags">
              {suggestedTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <p className="text-[11px] opacity-50">
              Tu peux écrire ce que tu veux. Si tu l’as déjà utilisé, ça
              apparaît ici.
            </p>

            {/* ✅ affichage des tags connus avec poubelle */}
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs"
                  >
                    {t}
                    {onTagDelete && (
                      <button
                        type="button"
                        onClick={() => onTagDelete(t)}
                        className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Supprimer ce tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Échéance */}
          <div className="grid gap-2">
            <label className="text-sm opacity-70">Échéance</label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-500">
              <CalendarDays className="h-4 w-4 opacity-70" />
              <input
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
                className="bg-transparent outline-none flex-1 dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Priorité / Statut / Terminé */}
      <div className={box}>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-sm opacity-70">Priorité</label>
            <select
              value={priorite}
              onChange={(e) => setPriorite(e.target.value as Priorite)}
              className={inputBase}
            >
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm opacity-70">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as Statut)}
              className={inputBase}
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="review">À revoir</option>
              <option value="done">Terminé</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm opacity-70">Marquer terminé</label>
            <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/10">
              <input
                type="checkbox"
                checked={terminee}
                onChange={(e) => setTerminee(e.target.checked)}
              />
              <span>Cocher si déjà fait</span>
            </label>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className={box}>
        <div className="grid gap-2">
          <label className="text-sm opacity-70">Image</label>
          <div className="flex flex-wrap items-start gap-4">
            {/* Aperçu grand, sans champ texte */}
            <div className="relative h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-slate-300 dark:border-slate-700">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="aperçu de la tâche"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
                    title="Retirer l’image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="h-8 w-8 opacity-60" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10">
                <Upload className="h-4 w-4" />
                <span>Choisir une image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
              </label>
              <p className="text-xs opacity-60 max-w-xs">
                Télécharge une image depuis ton appareil. Elle est envoyée et
                stockée automatiquement (aucune URL à gérer).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className={box}>
        <div className="grid gap-2">
          <label className="text-sm opacity-70">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={areaBase}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-xl px-4 py-2 bg-indigo-600 text-white hover:opacity-90 border border-indigo-700/60"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
