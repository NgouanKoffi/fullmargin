// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\Messages\DiffusionTab\DiffusionList.tsx
import { Plus, Edit3, FolderOpen, Trash2, Users, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import type { DiffusionGroup } from "./types";

/* ============================================================================
   Modal de confirmation (portail)
============================================================================ */
function ConfirmModal({
  open,
  title = "Confirmer la suppression",
  message = "Cette action est définitive.",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4"
      onMouseDown={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-[min(96vw,480px)] rounded-2xl bg-skin-surface ring-1 ring-skin-border/20 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border/15">
          <div id="confirm-title" className="font-semibold">
            {title}
          </div>
          <button className="rounded-lg p-1.5 hover:bg-skin-tile" onClick={onCancel} aria-label="Fermer" title="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 text-sm text-skin-muted">{message}</div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-skin-border/15">
          <button className="rounded-xl px-3 py-1.5 ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="rounded-xl px-3 py-1.5 text-sm ring-1 ring-red-300/30 text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ============================================================================
   Liste
============================================================================ */
type Props = {
  items: DiffusionGroup[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};



export default function DiffusionList({ items, onCreate, onOpen, onDelete }: Props) {
  // helper: renvoie un timestamp fiable même si updatedAt/createdAt manquent
    function ts(g: DiffusionGroup) {
      const d = g.updatedAt ?? g.createdAt;
      const t = d ? Date.parse(d) : NaN;
      return Number.isFinite(t) ? t : 0;
    }

    const sorted = useMemo(() => {
      return [...items].sort((a, b) => ts(b) - ts(a)); // plus récent d'abord
    }, [items]);


  // Compteur fiable: serveur (recipientCount) ou snapshotEmails
  const countsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of sorted) {
      const id = String(g.id || g._id);
      const count = typeof g.recipientCount === "number" ? g.recipientCount : (g.snapshotEmails?.length || 0);
      map.set(id, count);
    }
    return map;
  }, [sorted]);

  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const pending = useMemo(
    () => sorted.find((g) => String(g.id || g._id) === toDeleteId) || null,
    [sorted, toDeleteId]
  );

  const closeModal = useCallback(() => setToDeleteId(null), []);
  const confirmDelete = useCallback(() => {
    if (!toDeleteId) return;
    onDelete(toDeleteId);
    setToDeleteId(null);
  }, [onDelete, toDeleteId]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
        >
          <Plus className="w-4 h-4" />
          Nouveau groupe
        </button>
      </div>

      {/* Liste */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface divide-y divide-skin-border/10 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-6 text-sm text-skin-muted">Aucun groupe pour le moment. Crée ton premier groupe de diffusion.</div>
        ) : (
          sorted.map((g) => {
            const id = String(g.id || g._id);
            const count = countsById.get(id) ?? 0;
            return (
              <div key={id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
                    <FolderOpen className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-semibold truncate">{g.name || "Sans nom"}</div>
                      <span
                        className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-tile"
                        title={`${count} destinataire(s)`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {count}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-skin-muted">
                      Modifié le {g.updatedAt ? new Date(g.updatedAt).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => onOpen(id)}
                      className="rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
                      title="Éditer"
                      aria-label="Éditer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setToDeleteId(id)}
                      className="rounded-xl p-2 ring-1 ring-red-300/30 text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal suppression */}
      <ConfirmModal
        open={!!pending}
        title="Supprimer ce groupe ?"
        message={pending ? `« ${pending.name || "Sans nom"} » sera définitivement supprimé.` : "Cette action est définitive."}
        confirmText="Supprimer"
        cancelText="Annuler"
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}