// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Formations\steps\Step2Curriculum\ResourceCard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  FileVideo2,
  FileText,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Trash2,
} from "lucide-react";

import type { UIItem } from "./helpers";
import { displaySelectedName, displayCurrentName, uid } from "./helpers";
import type { CurriculumItemType } from "../../types";

type ResourceCardProps = {
  item: UIItem;
  onChangeItem: (patch: Partial<UIItem> & Record<string, unknown>) => void;
  onRemove: () => void;
  onFileChange: (
    baseType: CurriculumItemType,
    file: File | null | undefined
  ) => void;
};

type UIItemWithKey = UIItem & { __fileInputKey?: string };

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 Mo (même règle que Step2Curriculum)

function renderTypeIcon(subtype: UIItem["subtype"]) {
  switch (subtype) {
    case "video":
      return <FileVideo2 className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "link":
      return <Link2 className="h-4 w-4" />;
    case "doc":
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function ResourceCard({
  item,
  onChangeItem,
  onRemove,
  onFileChange,
}: ResourceCardProps) {
  const it = item as UIItemWithKey;

  const subtype: UIItem["subtype"] =
    item.subtype ??
    (item.type === "video" ? "video" : item.type === "image" ? "image" : "doc");

  const selectedName = displaySelectedName(item);
  const currentName = !selectedName ? displayCurrentName(item) : null;

  const hasUrl = typeof item.url === "string" && item.url.trim().length > 0;

  // baseType typé
  const baseType: CurriculumItemType =
    subtype === "video" ? "video" : subtype === "image" ? "image" : "pdf";

  const acceptAttr =
    subtype === "video"
      ? "video/*"
      : subtype === "image"
      ? "image/*"
      : "application/pdf";

  const hasMedia =
    !!item.file ||
    !!item.__serializedFile?.dataUrl ||
    hasUrl ||
    (!!item.filename && item.filename.trim().length > 0);

  // ✅ Message rouge (sans alert)
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!localError) return;
    const t = window.setTimeout(() => setLocalError(null), 4500);
    return () => window.clearTimeout(t);
  }, [localError]);

  // ✅ Key de reset input file (remount)
  const fileInputKey = useMemo(
    () => String(it.__fileInputKey || item.id),
    [it.__fileInputKey, item.id]
  );

  const resetFileInput = () => {
    onChangeItem({
      file: null,
      filename: null,
      __serializedFile: null,
      durationMin: undefined,
      __fileInputKey: uid(), // ✅ force remount du <input type="file">
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-xs sm:text-sm shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
      {/* header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {renderTypeIcon(subtype)}
          <select
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium dark:border-slate-700 dark:bg-slate-800"
            value={subtype}
            onChange={(e) => {
              const v = e.target.value as UIItem["subtype"];
              setLocalError(null);

              if (v === "video") {
                onChangeItem({
                  subtype: "video",
                  type: "video",
                  url: "",
                  file: null,
                  filename: null,
                  __serializedFile: null,
                  durationMin: undefined,
                  __fileInputKey: uid(),
                });
              } else if (v === "link") {
                onChangeItem({
                  subtype: "link",
                  type: "pdf",
                  file: null,
                  filename: null,
                  url: "",
                  __serializedFile: null,
                  durationMin: undefined,
                  __fileInputKey: uid(),
                });
              } else if (v === "image") {
                onChangeItem({
                  subtype: "image",
                  type: "image",
                  url: "",
                  file: null,
                  filename: null,
                  __serializedFile: null,
                  durationMin: undefined,
                  __fileInputKey: uid(),
                });
              } else {
                onChangeItem({
                  subtype: "doc",
                  type: "pdf",
                  url: "",
                  file: null,
                  filename: null,
                  __serializedFile: null,
                  durationMin: undefined,
                  __fileInputKey: uid(),
                });
              }
            }}
          >
            <option value="video">Vidéo</option>
            <option value="image">Image</option>
            <option value="doc">Document PDF</option>
            <option value="link">Lien externe</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-700/70 dark:hover:bg-rose-900/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* titre ressource */}
      <div className="mb-2">
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
          placeholder="Titre de la ressource"
          value={item.title ?? ""}
          onChange={(e) => onChangeItem({ title: e.target.value })}
        />
      </div>

      {/* fichier */}
      {subtype !== "link" && (
        <div className="mb-2">
          <input
            key={fileInputKey} // ✅ remount = reset visuel du fichier sélectionné
            type="file"
            accept={acceptAttr}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;

              // Rien sélectionné
              if (!file) {
                onFileChange(baseType, null);
                return;
              }

              const isVideo = file.type.startsWith("video/");
              const isImage = file.type.startsWith("image/");
              const isPdf = file.type === "application/pdf";

              // ❌ Mauvais type => pas de alert, on reset
              if (subtype === "video" && !isVideo) {
                setLocalError("Sélectionne uniquement une vidéo (MP4, MOV…).");
                e.currentTarget.value = "";
                resetFileInput();
                onFileChange(baseType, null);
                return;
              }

              if (subtype === "image" && !isImage) {
                setLocalError("Sélectionne uniquement une image (JPG, PNG…).");
                e.currentTarget.value = "";
                resetFileInput();
                onFileChange(baseType, null);
                return;
              }

              if (subtype === "doc" && !isPdf) {
                setLocalError("Sélectionne uniquement un fichier PDF.");
                e.currentTarget.value = "";
                resetFileInput();
                onFileChange(baseType, null);
                return;
              }

              // ⛔ Trop gros (200Mo) : on vide l’input tout de suite (sinon il reste affiché)
              // puis on laisse Step2Curriculum afficher le popup + nettoyer l’item
              if (file.size > MAX_UPLOAD_BYTES) {
                e.currentTarget.value = "";
                onChangeItem({ __fileInputKey: uid() }); // ✅ reset input visuel
                onFileChange(baseType, file); // ✅ déclenche ton popup parent
                return;
              }

              setLocalError(null);
              onFileChange(baseType, file);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] sm:text-xs outline-none dark:border-slate-700 dark:bg-slate-950"
          />

          {/* ✅ message rouge inline (pas d'alert) */}
          {localError && (
            <div className="mt-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200">
              {localError}
            </div>
          )}

          {selectedName ? (
            <div className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="font-medium">Fichier attaché :</span>{" "}
              {selectedName}
            </div>
          ) : currentName ? (
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span>
                <span className="font-medium">Actuel :</span> {currentName}
              </span>

              {hasUrl && (
                <a
                  href={item.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-dotted"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir
                </a>
              )}
            </div>
          ) : hasMedia ? (
            <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
              Une ressource est déjà enregistrée.
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-slate-400">
              Aucun fichier sélectionné.
            </div>
          )}
        </div>
      )}

      {/* lien externe */}
      {subtype === "link" && (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800">
              <Link2 className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="https://…"
              value={item.url ?? ""}
              onChange={(e) => onChangeItem({ url: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      )}

      {/* durée vidéo */}
      {subtype === "video" && (
        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
            Durée estimée (minutes)
          </label>
          <input
            type="number"
            readOnly
            value={item.durationMin ?? ""}
            placeholder="Auto"
            className="w-24 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px] text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>
      )}
    </div>
  );
}
