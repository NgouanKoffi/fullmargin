// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\components\ui\Toast.tsx
import { useEffect } from "react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";

export type ToastKind = "success" | "error";

export default function Toast({
  open,
  kind = "success",
  message,
  onClose,
  autoHideMs = 4000,
}: {
  open: boolean;
  kind?: ToastKind;
  message: string;
  onClose: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [open, autoHideMs, onClose]);

  if (!open) return null;
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle;
  const bg = kind === "success" ? "bg-emerald-600" : "bg-red-600";

  return (
    <div className="fixed top-4 right-4 z-[1000]">
      <div
        className={`relative min-w-[260px] max-w-[420px] text-white ${bg} shadow-2xl rounded-xl px-4 py-3`}
      >
        <div className="flex items-start gap-2">
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm leading-5">{message}</div>
          <button
            onClick={onClose}
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/20"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
