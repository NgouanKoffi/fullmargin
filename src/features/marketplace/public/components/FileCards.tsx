// src/pages/marketplace/public/ProductPreview/components/FileCards.tsx
import type React from "react";
import { Link } from "react-router-dom";
import { Download, FileText, Lock } from "lucide-react";

export function LockedFileCard({
  fileName,
  fileMime,
}: {
  fileName?: string;
  fileMime?: string;
}) {
  const onBlockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert(
      "Téléchargement réservé aux acheteurs.\nAprès achat, vous retrouverez le fichier dans vos commandes."
    );
  };

  return (
    <div
      onClick={onBlockedClick}
      className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 cursor-not-allowed select-none"
      title="Téléchargement verrouillé"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <Lock className="w-5 h-5 opacity-80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium flex items-center gap-1 break-words">
            <FileText className="w-4 h-4 opacity-70" />
            {fileName?.trim() ? (
              <span className="break-all">{fileName}</span>
            ) : (
              <span>Fichier du produit</span>
            )}
          </div>
          <div className="text-xs opacity-70 break-words">
            {fileMime?.trim() ? `${fileMime} · ` : ""}{" "}
            <span className="font-semibold">Verrouillé</span> — réservé aux
            acheteurs
          </div>
        </div>
        <span className="self-start sm:ml-auto sm:self-center text-[11px] font-semibold px-2 py-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          🔒 Bloqué
        </span>
      </div>
    </div>
  );
}

export function UnlockedFileLinkCard({
  to,
  fileName,
  fileMime,
}: {
  to: string;
  fileName?: string;
  fileMime?: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 hover:bg-white dark:hover:bg-neutral-800 transition"
      title="Ouvrir mes téléchargements"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium flex items-center gap-1 break-words">
            <FileText className="w-4 h-4 opacity-70" />
            {fileName?.trim() ? (
              <span className="break-all">{fileName}</span>
            ) : (
              <span>Fichier du produit</span>
            )}
          </div>
          <div className="text-xs opacity-70 break-words">
            {fileMime?.trim() ? `${fileMime} · ` : ""}{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Déverrouillé
            </span>{" "}
            — ouvrir mes téléchargements
          </div>
        </div>
        <span className="self-start sm:ml-auto sm:self-center text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-600 text-white">
          ✓ Accès
        </span>
      </div>
    </Link>
  );
}
