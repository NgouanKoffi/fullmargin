import { useMemo, useState } from "react";
import type { Row } from "../types";
import type { Folder as FolderType } from "../foldersStore";
import NoteCard from "./NoteCard";
import FolderCard from "./FolderCard";
import { exportNoteAsPDF } from "../utils/exportPdf";
import MoveNoteModal from "./modals/MoveNoteModal";
import InfoModal from "./modals/InfoModal";
import { FolderPlus, Square, CheckSquare, MoveRight } from "lucide-react";

/** mêmes accents pour les traits de couleur */
const accents = [
  "from-violet-500 via-fuchsia-500 to-sky-500",
  "from-emerald-500 via-lime-500 to-teal-500",
  "from-rose-500 via-orange-500 to-amber-500",
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-cyan-500 via-sky-500 to-blue-500",
];

export default function NotesList({
  folders,
  allFolders, // ⬅️ optionnel : l’arbre complet pour le modal
  notes,
  loading,
  onOpenNote,
  onShareNote,
  onDeleteNote,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateSubFolder,
  onDropNoteToFolder,
}: {
  folders: FolderType[]; // niveau courant (affiché en grille)
  allFolders?: FolderType[]; // ⬅️ optionnel : tout l’arbre pour la cible de déplacement
  notes: Row[];
  loading: boolean;
  onOpenNote: (id: string) => void;
  onShareNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onRenameFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateSubFolder: (parentId: string) => void;
  onDropNoteToFolder: (noteId: string, folderId: string | null) => void;
}) {
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes]
  );

  /* ---------- Sélection multiple ---------- */
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectedCount = selected.size;

  const toggleSelectMode = () => {
    setSelectMode((v) => {
      if (v) setSelected(new Set());
      return !v;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const cp = new Set(prev);
      if (cp.has(id)) cp.delete(id);
      else cp.add(id);
      return cp;
    });
  };
  const selectAll = () => setSelected(new Set(sortedNotes.map((n) => n.id)));
  const selectNone = () => setSelected(new Set());

  /* ---------- Modales locales ---------- */
  const [moveOpen, setMoveOpen] = useState<null | {
    noteId: string;
    currentFolderId: string | null;
  }>(null);
  const [moveManyOpen, setMoveManyOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const handleExportPdf = async (id: string) => {
    await exportNoteAsPDF(id, () => setPopupBlocked(true));
  };

  // Pour le modal de déplacement, on veut l’arbre complet si fourni
  const foldersForModal = allFolders ?? folders;

  return (
    <section className="mt-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Contenu
        </h2>
        <span className="text-xs opacity-60">
          {loading
            ? "Chargement…"
            : `${folders.length} dossier${folders.length > 1 ? "s" : ""} • ${
                sortedNotes.length
              } note${sortedNotes.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Bandeau actions sélection */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {selectMode ? (
          <>
            <button
              type="button"
              onClick={toggleSelectMode}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-white/10"
              title="Quitter la sélection"
            >
              <CheckSquare className="w-4 h-4" />
              Quitter la sélection
            </button>

            <span className="text-xs opacity-70">
              {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
            </span>

            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg px-3 py-2 text-xs ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-white/10"
            >
              Tout
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="rounded-lg px-3 py-2 text-xs ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-white/10"
            >
              Aucun
            </button>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => setMoveManyOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-50"
              title="Déplacer la sélection"
            >
              <MoveRight className="w-4 h-4" />
              Déplacer ({selectedCount})
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSelectMode}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-white/10"
            title="Activer la sélection"
          >
            <Square className="w-4 h-4" />
            Sélectionner
          </button>
        )}
      </div>

      {/* Grille responsive */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
        {folders.map((f, idx) => (
          <li key={`f-${f.id}`} className="min-w-0">
            <FolderCard
              id={f.id}
              name={f.name}
              accent={accents[idx % accents.length]}
              onOpen={onOpenFolder}
              onRename={(id) => onRenameFolder(id)}
              onCreateSub={(id) => onCreateSubFolder(id)}
              onDelete={(id) => onDeleteFolder(id)}
              onDropNote={(noteId, folderId) =>
                onDropNoteToFolder(noteId, folderId)
              }
            />
          </li>
        ))}

        {sortedNotes.map((n, idx) => (
          <li key={n.id} className="min-w-0 relative">
            {selectMode ? (
              <label
                className="absolute left-2 top-2 z-10 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur px-2 py-1 shadow cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="mr-1 align-middle"
                  checked={selected.has(n.id)}
                  onChange={() => toggleOne(n.id)}
                />
                <span className="text-xs">Sélect.</span>
              </label>
            ) : null}

            <NoteCard
              note={n}
              accent={accents[(folders.length + idx) % accents.length]}
              onOpen={onOpenNote}
              onAskMove={(id) =>
                setMoveOpen({ noteId: id, currentFolderId: null })
              }
              onExportPdf={handleExportPdf}
              onShare={onShareNote}
              onDelete={onDeleteNote}
            />
          </li>
        ))}

        {!loading && folders.length === 0 && sortedNotes.length === 0 ? (
          <li className="col-span-full">
            <div className="h-[46vh] sm:h-[52vh] flex items-center justify-center">
              <div className="text-center rounded-2xl border border-black/15 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur p-8 sm:p-10 shadow-sm">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white
                        flex items-center justify-center shadow-lg shadow-violet-500/20"
                >
                  <FolderPlus className="w-8 h-8" />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-semibold">
                  Rien ici pour l’instant
                </h3>
                <p className="mt-1 text-sm opacity-70">
                  Crée un dossier ou une note pour commencer.
                </p>
              </div>
            </div>
          </li>
        ) : null}
      </ul>

      {/* Déplacer 1 note */}
      {moveOpen ? (
        <MoveNoteModal
          open
          folders={foldersForModal}
          currentFolderId={moveOpen.currentFolderId}
          onCancel={() => setMoveOpen(null)}
          onConfirm={(folderId) => {
            onDropNoteToFolder(moveOpen.noteId, folderId);
            setMoveOpen(null);
          }}
        />
      ) : null}

      {/* Déplacer sélection */}
      {moveManyOpen ? (
        <MoveNoteModal
          open
          folders={foldersForModal}
          currentFolderId={null}
          onCancel={() => setMoveManyOpen(false)}
          onConfirm={(folderId) => {
            selected.forEach((id) => onDropNoteToFolder(id, folderId));
            setMoveManyOpen(false);
            setSelected(new Set());
          }}
        />
      ) : null}

      {/* Info : popup bloquée à l'export */}
      <InfoModal
        open={popupBlocked}
        title="Pop-up bloquée"
        message="Votre navigateur a bloqué l'ouverture de la fenêtre d'impression. Autorisez les pop-ups pour fullmargin.net puis réessayez."
        onClose={() => setPopupBlocked(false)}
      />
    </section>
  );
}
