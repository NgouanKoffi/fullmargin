// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\SidebarGestion.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  X,
  ChevronRight,
  Eye,
  Users,
  MessageSquareText,
  Settings2,
  Mic,
  ShoppingBag,
  LayoutDashboard,
  LifeBuoy,
  Lock, // cadenas rouge
  LineChart, // Accès Full Metrix
  Users2, // Communautés
  BadgeDollarSign,
  Bitcoin, // ✅ Marketplace - crypto
} from "lucide-react";

type Item = {
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

/* ============================ Menus par rôle ============================ */
// Menu complet pour ADMIN
const ADMIN_ITEMS: Item[] = [
  // {
  //   label: "Dashboard",
  //   to: "/admin/dashboard",
  //   Icon: LayoutDashboard,
  //   disabled: true,
  // },
  { label: "Visite", to: "/admin/visites", Icon: Eye },
  { label: "Utilisateurs", to: "/admin/utilisateurs", Icon: Users },
  // { label: "Services", to: "/admin/permissions", Icon: KeyRound },

  // 👉 Accès Full Metrix
  {
    label: "Accès Full Metrix",
    to: "/admin/fullmetrix",
    Icon: LineChart,
  },

  // 👉 Communautés
  {
    label: "Communautés",
    to: "/admin/communautes",
    Icon: Users2,
  },

  { label: "Retraits", to: "/admin/wallet/withdrawals", Icon: BadgeDollarSign },

  { label: "Email", to: "/admin/messages", Icon: MessageSquareText },
  { label: "Podcasts", to: "/admin/podcasts", Icon: Mic },

  { label: "Marketplace", to: "/admin/marketplace", Icon: ShoppingBag },

  // ✅ NOUVEAU: juste en dessous
  {
    label: "Marketplace - crypto",
    to: "/admin/marketplace-crypto",
    Icon: Bitcoin,
  },
];

// Menu pour AGENT
const AGENT_ITEMS: Item[] = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    Icon: LayoutDashboard,
    disabled: true,
  },
  { label: "Email", to: "/admin/messages", Icon: MessageSquareText },
  { label: "Podcasts", to: "/admin/podcasts", Icon: Mic },
  {
    label: "Service client",
    to: "/admin/support",
    Icon: LifeBuoy,
    disabled: true,
  },
];

/* ================================ UI =================================== */

export default function SidebarGestion() {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = status === "authenticated" && roles.includes("admin");
  const isAgent = status === "authenticated" && roles.includes("agent");
  const canSeeGestion = isAdmin || isAgent;

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = "sidebar-gestion-title";

  const ITEMS = useMemo<Item[]>(
    () => (isAdmin ? ADMIN_ITEMS : isAgent ? AGENT_ITEMS : []),
    [isAdmin, isAgent],
  );

  const openPanel = useCallback((emit = false) => {
    setOpen(true);
    if (emit) window.dispatchEvent(new CustomEvent("fm:gestion-opened"));
  }, []);

  const closePanel = useCallback((emit = false) => {
    setOpen(false);
    if (emit)
      window.dispatchEvent(
        new CustomEvent("fm:close-gestion", { detail: { source: "sidebar" } }),
      );
  }, []);

  useEffect(() => {
    const onOpen = () => openPanel(false);
    const onClose = () => closePanel(false);
    window.addEventListener("fm:open-gestion", onOpen);
    window.addEventListener("fm:close-gestion", onClose);
    return () => {
      window.removeEventListener("fm:open-gestion", onOpen);
      window.removeEventListener("fm:close-gestion", onClose);
    };
  }, [openPanel, closePanel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!canSeeGestion) return null;

  // Styles centralisés
  const baseItem =
    "group rounded-2xl px-4 py-3 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile transition flex items-center gap-3";

  // ✅ CORRECTION ICI :
  // J'ai retiré "hover:" devant le bg et ajouté "!text-white" pour que ce soit lisible sur fond violet
  const activeItem = "fm-active !bg-[#7c3aed] !text-white";

  const iconBase = "w-5 h-5";
  const iconWrapBase =
    "shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ring-1 ring-skin-border/20 bg-skin-surface";

  const iconWrapActive =
    "!bg-white !text-[#7c3aed] !ring-white/30 dark:!bg-white";

  return (
    <div
      className={`fixed inset-0 z-[70] ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
      aria-modal={open || undefined}
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => closePanel(true)}
        style={{
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
        }}
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "absolute right-0 top-0 h-full",
          "w-full sm:w-[420px] lg:w-[520px]",
          "bg-skin-surface ring-1 ring-skin-border/15 shadow-2xl",
          open ? "translate-x-0" : "translate-x-full",
          "transition-transform duration-300 ease-out",
          "flex flex-col focus:outline-none",
        ].join(" ")}
      >
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-skin-border/15 supports-[backdrop-filter]:bg-skin-surface/60">
          <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
            <Settings2 className="w-5 h-5" />
          </div>
          <h2 id={titleId} className="text-skin-base font-semibold">
            Gestion
          </h2>
          <button
            aria-label="Fermer"
            className="ml-auto rounded-full p-2 text-skin-muted hover:text-skin-base hover:bg-skin-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
            onClick={() => closePanel(true)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste */}
        <div className="p-3 sm:p-4 space-y-2 overflow-y-auto">
          {ITEMS.map(({ label, to, Icon, disabled }) => {
            if (disabled) {
              // élément non cliquable
              return (
                <div
                  key={to}
                  className="rounded-2xl px-4 py-3 ring-1 ring-skin-border/10 bg-skin-surface/60 flex items-center gap-3 cursor-not-allowed opacity-80"
                  aria-disabled
                >
                  <span className={iconWrapBase}>
                    <Icon className={iconBase} />
                  </span>
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <Lock className="w-4 h-4 text-red-500" />
                </div>
              );
            }

            // élément cliquable
            return (
              <NavLink
                key={to}
                to={to}
                end={false}
                onClick={() => closePanel(true)}
                className={({ isActive }) =>
                  [baseItem, isActive ? activeItem : ""].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        iconWrapBase,
                        isActive ? iconWrapActive : "",
                      ].join(" ")}
                    >
                      <Icon className={iconBase} />
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ml-auto transition-opacity ${
                        isActive
                          ? "opacity-100"
                          : "opacity-60 group-hover:opacity-100"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
