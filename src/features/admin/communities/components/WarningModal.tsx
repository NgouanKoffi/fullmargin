// src/features/admin/communities/components/WarningModal.tsx
import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function WarningModal({ open, title, loading, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-skin-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-skin-border/20 flex items-center justify-between bg-orange-500/10">
          <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Envoyer un avertissement
          </h3>
          <button onClick={handleCancel} disabled={loading} className="text-skin-muted hover:text-skin-base p-1 rounded-lg hover:bg-skin-inset">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-skin-base">
            Vous allez envoyer un avertissement à :<br />
            <span className="font-semibold text-violet-600 dark:text-violet-400 mt-1 inline-block">{title}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-skin-base mb-1">
              Motif (sera envoyé à l'auteur)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="Ex: Contenu inapproprié, spam..."
              className="w-full rounded-xl border border-skin-border/30 bg-skin-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none shadow-sm"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-skin-inset/50 border-t border-skin-border/20 flex justify-end gap-3">
          <button onClick={handleCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-skin-base hover:bg-skin-border/40 rounded-xl transition disabled:opacity-50">
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Envoi..." : "Envoyer l'avertissement"}
          </button>
        </div>
      </div>
    </div>
  );
}
