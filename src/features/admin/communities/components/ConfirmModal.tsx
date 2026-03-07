// src/features/admin/communities/components/ConfirmModal.tsx
import { X, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  icon?: React.ElementType;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open, title, description, confirmLabel,
  confirmClass = "bg-red-600 hover:bg-red-700 text-white",
  icon: Icon,
  loading = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-skin-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-skin-border/20 flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-red-500" />
            </div>
          )}
          <h3 className="text-base font-bold text-skin-base flex-1">{title}</h3>
          <button onClick={onCancel} disabled={loading} className="text-skin-muted hover:text-skin-base p-1 rounded-lg hover:bg-skin-inset">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-skin-muted leading-relaxed">{description}</p>
        </div>
        <div className="px-6 py-4 bg-skin-inset/40 border-t border-skin-border/20 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-skin-base hover:bg-skin-border/40 rounded-xl transition disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition disabled:opacity-50 shadow-md ${confirmClass}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
