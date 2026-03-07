// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\BalanceChip.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Store, Users, CreditCard, Link2 } from "lucide-react";
import clsx from "clsx";

/** 1300 -> 1.3K, 200000 -> 200K, 1200000 -> 1.2M */
function formatShort(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1000) return new Intl.NumberFormat().format(n);
  if (abs < 1_000_000) {
    const k = n / 1000;
    return abs < 10_000 ? `${Math.round(k * 10) / 10}K` : `${Math.round(k)}K`;
  }
  return `${Math.round((n / 1_000_000) * 10) / 10}M`;
}

function currencySymbol(cur?: string): string {
  const c = (cur || "USD").toUpperCase();
  if (c === "EUR") return "€";
  if (c === "XOF" || c === "FCFA") return "F CFA";
  if (c === "GBP") return "£";
  return "$";
}

type Props = {
  /** Net disponible marketplace (solde réel dispo au retrait) */
  marketplace: number;
  /** Solde communauté (0 pour l’instant) */
  community: number;
  /** ✅ Solde d’affiliation (en cents, même devise) */
  affiliation?: number;
  currency?: string;
  className?: string;
  size?: "md" | "sm";
  loading?: boolean;
  withdrawHref?: string;
};

const CENTRAL_WITHDRAW_HREF_DEFAULT = "/wallet/withdraw";

export default function BalanceChip({
  marketplace,
  community,
  affiliation = 0,
  currency = "USD",
  className,
  size = "sm",
  loading = false,
  withdrawHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
  const navigate = useNavigate();

  // total = tout
  const total = (marketplace || 0) + (community || 0) + (affiliation || 0);
  const sym = currencySymbol(currency);

  useLayoutEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const resize = () => setMenuWidth(el.getBoundingClientRect().width);
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const pad = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const txt = size === "sm" ? "text-sm" : "text-base";
  const MIN_MENU_W = 260;

  const moneyCls =
    "text-red-600 dark:text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,.35)]";

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const WITHDRAW_HREF = withdrawHref || CENTRAL_WITHDRAW_HREF_DEFAULT;

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !loading && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        disabled={loading}
        className={clsx(
          "w-full inline-flex items-center justify-between rounded-xl",
          pad,
          "bg-white/95 dark:bg-[#111318]/95 text-skin-base",
          "ring-1 ring-skin-border/40 hover:ring-skin-border/60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring",
          "transition-colors",
          loading && "opacity-70 cursor-not-allowed",
        )}
        title={
          loading ? "Chargement du solde…" : "Afficher le détail des gains"
        }
      >
        <span
          className={clsx(
            "font-semibold",
            txt,
            "whitespace-nowrap",
            moneyCls,
            loading && "opacity-70",
          )}
        >
          {sym}
          {formatShort(total)}
        </span>
        <ChevronDown
          className={clsx(
            "w-4 h-4 opacity-80 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && !loading && (
        <div
          role="listbox"
          className={clsx(
            "absolute left-0 mt-1 rounded-xl overflow-hidden z-50",
            "bg-white dark:bg-[#0f1115]",
            "ring-1 ring-skin-border/40 shadow-lg",
          )}
          style={{
            minWidth: Math.max(menuWidth || 0, MIN_MENU_W),
          }}
        >
          {/* Ma boutique */}
          <OptionRow
            icon={<Store className="w-4 h-4" />}
            label="Ma boutique"
            value={`${sym}${formatShort(marketplace || 0)}`}
            moneyCls={moneyCls}
            onClick={() => go("/marketplace/dashboard?tab=ventes")}
          />

          <Divider />

          {/* Communauté */}
          <OptionRow
            icon={<Users className="w-4 h-4" />}
            label="Communauté"
            value={`${sym}${formatShort(community || 0)}`}
            moneyCls={moneyCls}
            onClick={() => go("/communaute/mon-espace?tab=ventes")}
          />

          <Divider />

          {/* ✅ Affiliation */}
          <OptionRow
            icon={<Link2 className="w-4 h-4" />}
            label="Affiliation"
            value={`${sym}${formatShort(affiliation || 0)}`}
            moneyCls={moneyCls}
            onClick={() => go("/profil?tab=affiliation")}
          />

          <Divider />

          {/* Retrait */}
          <OptionRow
            icon={<CreditCard className="w-4 h-4" />}
            label="Retrait"
            value="Aller"
            moneyCls="text-skin-muted"
            onClick={() => go(WITHDRAW_HREF)}
          />
        </div>
      )}
    </div>
  );
}

/* --- sous-composants --- */

function OptionRow({
  icon,
  label,
  value,
  moneyCls,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  moneyCls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      onClick={onClick}
      className={clsx(
        "w-full px-3.5 py-2.5 text-sm",
        "flex items-center gap-3",
        "hover:bg-black/5 dark:hover:bg:white/10 dark:hover:bg-white/10",
        "text-skin-base/90 hover:text-skin-base",
      )}
    >
      <span
        className="
          inline-flex items-center justify-center w-8 h-8 rounded-full
          bg-white/80 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10
          shrink-0
        "
      >
        {icon}
      </span>
      <span className="flex-1 text-left whitespace-nowrap">{label}</span>
      <span className={clsx("font-semibold whitespace-nowrap", moneyCls)}>
        {value}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-skin-border/20" />;
}
