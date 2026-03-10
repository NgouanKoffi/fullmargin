import { ShieldCheck, X } from "lucide-react";
import type { ToastState } from "../usePricingPayment";

type Props = {
  toast: ToastState | null;
  clearToast: () => void;
};

export function PricingToast({ toast, clearToast }: Props) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[999] max-w-sm w-full sm:w-auto rounded-2xl shadow-lg border flex items-start gap-3 p-3 pr-2
        ${
          toast.tone === "error"
            ? "bg-red-500 text-white border-red-500/70"
            : toast.tone === "success"
              ? "bg-emerald-500 text-white border-emerald-500/70"
              : "bg-indigo-500 text-white border-indigo-500/70"
        }
      `}
    >
      <div className="mt-0.5">
        <ShieldCheck className="w-5 h-5 opacity-90" />
      </div>
      <div className="flex-1 text-sm leading-snug">
        {toast.message.split("\n").map((line: string, idx: number) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      <button
        onClick={clearToast}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
