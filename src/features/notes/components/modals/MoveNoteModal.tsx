import { useState, useEffect } from "react";
import Modal from "./Modal";
import type { Folder } from "../../foldersStore";

export default function MoveNoteModal({
  open,
  folders,
  currentFolderId,
  count = 1,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  folders: Folder[];
  currentFolderId: string | null;
  count?: number; // ← NOUVEAU : pour afficher "Déplacer X notes"
  onCancel: () => void;
  onConfirm: (folderId: string | null) => void;
}) {
  const [target, setTarget] = useState<string | "root" | null>(
    currentFolderId ?? "root"
  );

  // ré-initialise la cible à l’ouverture
  useEffect(() => {
    if (open) setTarget(currentFolderId ?? "root");
  }, [open, currentFolderId]);

  return (
    <Modal
      open={open}
      title={count > 1 ? `Déplacer ${count} notes` : "Déplacer la note"}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white font-semibold"
            onClick={() =>
              onConfirm(target && target !== "root" ? target : null)
            }
          >
            Déplacer ici
          </button>
        </div>
      }
    >
      <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mv"
            checked={target === "root"}
            onChange={() => setTarget("root")}
          />
          <span>Racine (hors dossier)</span>
        </label>
        {folders.map((f) => (
          <label key={f.id} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mv"
              checked={target === f.id}
              onChange={() => setTarget(f.id)}
            />
            <span>{f.name}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
