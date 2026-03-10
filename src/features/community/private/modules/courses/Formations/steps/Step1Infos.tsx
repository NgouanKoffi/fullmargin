// src/pages/communaute/private/community-details/tabs/Formations/steps/Step1Infos.tsx
import { useEffect, useRef } from "react";
import type { CourseDraft, Level } from "../types";
import {
  Image as ImageIcon,
  X,
  Upload,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import type { Block } from "@blocknote/core";

const LEVELS: Level[] = ["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"];
const TITLE_MAX = 120;
const COVER_MAX_MB = 2;

/* ---------- Helpers BlockNote ---------- */

function safeParseBlocks(raw: string | undefined | null): Block[] | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed as Block[];
    }
  } catch {
    // pas du JSON BlockNote → on laisse l’éditeur créer un doc vide
  }
  return undefined;
}

/* ---------- Éditeur BlockNote : description + objectifs ---------- */

function DescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  // 1) Création de l’éditeur avec le contenu initial si dispo
  const editor = useCreateBlockNote({
    initialContent: safeParseBlocks(value),
  });

  // 2) Sync PARENT → ÉDITEUR (quand on ouvre une autre formation)
  useEffect(() => {
    const blocksFromProp = safeParseBlocks(value);
    if (!blocksFromProp) return;

    try {
      const currentJson = JSON.stringify(editor.document);
      const incomingJson = JSON.stringify(blocksFromProp);

      if (currentJson !== incomingJson) {
        // Remplace le document actuel par celui venant de la BDD
        editor.replaceBlocks(editor.topLevelBlocks, blocksFromProp);
      }
    } catch {
      // on ignore, l’éditeur garde son état actuel
    }
  }, [value, editor]);

  // 3) Sync ÉDITEUR → PARENT
  const handleChange = () => {
    try {
      const json = JSON.stringify(editor.document);
      onChange(json);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-900 p-2 sm:p-3">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={handleChange}
        className="bn-prose"
      />
    </div>
  );
}

/* ---------- Étape 1 : Couverture + infos + bloc texte riche ---------- */

export default function Step1Infos({
  data,
  onChange,
}: {
  data: CourseDraft;
  onChange: (patch: Partial<CourseDraft>) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openPicker = () => inputRef.current?.click();

  const hasCover = !!data.coverFile || !!data.coverPreview;

  const onFile = (f?: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/i.test(f.type)) {
      return alert("Formats autorisés : JPG/PNG.");
    }
    if (f.size > COVER_MAX_MB * 1024 * 1024) {
      return alert(`Image trop lourde (max ${COVER_MAX_MB} Mo).`);
    }
    const url = URL.createObjectURL(f);
    onChange({ coverFile: f, coverPreview: url });
  };

  const clearCover = () => {
    onChange({ coverFile: null, coverPreview: null });
  };

  return (
    <div className="space-y-8 w-full">
      {/* Ligne du haut : Couverture / Titre & Niveau */}
      <section className="grid gap-4 xl:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch">
        {/* Couverture */}
        <div className="h-full rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-900 p-4 text-sm sm:text-base">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-2 sm:gap-3 mb-3">
            <h3 className="font-medium break-words leading-snug text-[13px] sm:text-[15px]">
              Couverture (JPG/PNG, max {COVER_MAX_MB} Mo){" "}
              <span className="text-rose-500">*</span>
            </h3>

            <div className="flex items-center gap-2 justify-start sm:justify-end shrink-0">
              {!!data.coverPreview && (
                <button
                  onClick={clearCover}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  title="Retirer l’image"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                  Retirer
                </button>
              )}
              <button
                onClick={openPicker}
                aria-label="Choisir un fichier"
                title="Choisir un fichier"
                type="button"
                className="inline-flex items-center justify-center rounded-lg h-8 w-8 sm:h-9 sm:w-9 bg-violet-600 text-white hover:bg-violet-700"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />

          <div
            onClick={openPicker}
            className={[
              "relative cursor-pointer rounded-xl overflow-hidden ring-2",
              hasCover
                ? "ring-slate-200 dark:ring-slate-700"
                : "ring-rose-400 dark:ring-rose-500",
              "bg-slate-50 dark:bg-slate-800",
            ].join(" ")}
            style={{ aspectRatio: "16/9" }}
          >
            {data.coverPreview ? (
              <img
                src={data.coverPreview}
                alt="Aperçu couverture"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                <ImageIcon className="h-5 w-5" />
                <span>Aucun aperçu</span>
              </div>
            )}
          </div>

          {!hasCover && (
            <p className="mt-2 inline-flex items-center gap-2 text-[12px] text-rose-500">
              <AlertTriangle className="h-4 w-4" />
              Image de couverture requise.
            </p>
          )}
        </div>

        {/* Colonne droite : Titre + Niveau */}
        <div className="h-full flex flex-col gap-4">
          {/* Titre */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm text-sm sm:text-base">
            <label className="block text-[12px] sm:text-sm font-medium mb-2">
              Titre du cours <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={TITLE_MAX}
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex : React Native (2025) – Guide complet"
              className="w-full rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/60 ring-1 ring-slate-200 dark:ring-slate-700 outline-none text-sm sm:text-base"
            />
            <div className="mt-1 text-[11px] text-slate-400">
              {data.title.length}/{TITLE_MAX}
            </div>
          </div>

          {/* Niveau */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm text-sm sm:text-base">
            <label className="block text-[12px] sm:text-sm font-medium mb-2">
              Niveau <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={data.level}
                onChange={(e) => onChange({ level: e.target.value as Level })}
                className="w-full rounded-xl px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-950/60 ring-1 ring-slate-200 dark:ring-slate-700 outline-none appearance-none text-sm sm:text-base"
              >
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Bloc unique : objectifs + description (BlockNote) */}
      <section className="rounded-2xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 sm:p-5 text-sm sm:text-base">
        <h3 className="text-[15px] sm:text-lg font-semibold leading-snug">
          Objectifs & description de la formation
        </h3>
        <p className="mt-1 text-[12px] sm:text-xs text-slate-500 dark:text-slate-400">
          Décris ce que les apprenants vont apprendre, le public visé, les
          prérequis, le déroulé… Tu peux utiliser les listes, titres, gras, etc.
        </p>

        <div className="mt-3">
          <DescriptionEditor
            value={data.longDesc || ""}
            onChange={(val) => onChange({ longDesc: val })}
          />
        </div>
      </section>
    </div>
  );
}
