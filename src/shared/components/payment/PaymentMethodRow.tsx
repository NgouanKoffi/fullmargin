// src/components/payment/PaymentMethodRow.tsx
import { Loader2, ChevronRight, type LucideIcon } from "lucide-react";

type ThemeColor = "indigo" | "emerald" | "amber";

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  theme: ThemeColor;
};

export default function PaymentMethodRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  isLoading,
  disabled,
  theme,
}: Props) {
  const themeStyles = {
    indigo: {
      text: "text-indigo-400",
      bgIcon:
        "bg-indigo-500/10 border-indigo-500/30 group-hover:bg-indigo-500/20",
      textGroup: "group-hover:text-indigo-200",
      hoverBorder: "hover:bg-indigo-950/20 hover:border-indigo-500/50",
    },
    emerald: {
      text: "text-emerald-400",
      bgIcon:
        "bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20",
      textGroup: "group-hover:text-emerald-200",
      hoverBorder: "hover:bg-emerald-950/20 hover:border-emerald-500/50",
    },
    amber: {
      text: "text-amber-400",
      bgIcon: "bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20",
      textGroup: "group-hover:text-amber-200",
      hoverBorder: "hover:bg-amber-950/20 hover:border-amber-500/50",
    },
  };

  const styles = themeStyles[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full group flex items-center justify-between rounded-xl px-4 py-4 sm:py-3 text-left border transition-all duration-200
        ${
          disabled || isLoading
            ? "opacity-50 cursor-not-allowed bg-slate-900 border-slate-800"
            : `bg-slate-900/60 border-slate-700/60 ${styles.hoverBorder}`
        }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition ${styles.bgIcon}`}
        >
          <Icon className={`h-6 w-6 sm:h-5 sm:w-5 ${styles.text}`} />
        </div>
        <div>
          <span
            className={`block text-base sm:text-sm font-semibold text-slate-100 transition ${styles.textGroup}`}
          >
            {title}
          </span>
          <span className="block text-sm sm:text-xs text-slate-500">
            {subtitle}
          </span>
        </div>
      </div>
      {isLoading ? (
        <Loader2
          className={`h-5 w-5 sm:h-4 sm:w-4 animate-spin ${styles.text}`}
        />
      ) : (
        <ChevronRight
          className={`h-5 w-5 sm:h-4 sm:w-4 text-slate-600 transition ${styles.text.replace("text-", "group-hover:text-")}`}
        />
      )}
    </button>
  );
}
