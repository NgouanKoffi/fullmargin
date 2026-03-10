// src/components/Header/SidebarGestion.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@core/auth/AuthContext";
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
  Lock,
  LineChart,
  Users2,
  BadgeDollarSign,
  Bitcoin,
  KeyRound,
} from "lucide-react";

type Item = {
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  permission?: string;
};

const ADMIN_ITEMS: Item[] = [
  { label: "Visite", to: "/admin/visites", Icon: Eye, permission: "visites" },
  {
    label: "Utilisateurs",
    to: "/admin/utilisateurs",
    Icon: Users,
    permission: "utilisateurs",
  },
  {
    label: "Accord d'accès",
    to: "/admin/permissions",
    Icon: KeyRound,
    permission: "permissions",
  },
  {
    label: "Accès Full Metrix",
    to: "/admin/fullmetrix",
    Icon: LineChart,
    permission: "fullmetrix",
  },
  {
    label: "Communautés",
    to: "/admin/communautes",
    Icon: Users2,
    permission: "communautes",
  },
  {
    label: "Retraits",
    to: "/admin/wallet/withdrawals",
    Icon: BadgeDollarSign,
    permission: "retraits",
  },
  {
    label: "Email",
    to: "/admin/messages",
    Icon: MessageSquareText,
    permission: "messages",
  },
  {
    label: "Podcasts",
    to: "/admin/podcasts",
    Icon: Mic,
    permission: "podcasts",
  },
  {
    label: "Marketplace",
    to: "/admin/marketplace",
    Icon: ShoppingBag,
    permission: "marketplace",
  },
  {
    label: "Marketplace - crypto",
    to: "/admin/marketplace-crypto",
    Icon: Bitcoin,
    permission: "marketplace-crypto",
  },
];

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

export default function SidebarGestion() {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];

  const userPermissions = Array.isArray((user as any)?.adminPermissions)
    ? (user as any).adminPermissions
    : [];

  const isAdmin = status === "authenticated" && roles.includes("admin");
  const isAgent = status === "authenticated" && roles.includes("agent");
  const canSeeGestion = isAdmin || isAgent;

  // ✅ SECURITÉ CORRIGÉE : Seulement TOI es le vrai boss.
  // Les autres admins (comme fullmargin.net@gmail.com) vont subir le filtre des cases cochées !
  const SUPER_ADMIN_EMAILS = [
    "koffingouanemmanuel0@gmail.com",
    "alissson909@gmail.com",
  ];
  const isSuperAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = "sidebar-gestion-title";

  const ITEMS = useMemo<Item[]>(() => {
    if (isAdmin) {
      if (isSuperAdmin) return ADMIN_ITEMS;

      return ADMIN_ITEMS.filter((item) => {
        if (!item.permission) return true;
        return userPermissions.includes(item.permission);
      });
    }
    if (isAgent) return AGENT_ITEMS;
    return [];
  }, [isAdmin, isAgent, userPermissions, isSuperAdmin]);

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

  const baseItem =
    "group rounded-2xl px-4 py-3 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile transition flex items-center gap-3";
  const activeItem = "fm-active !bg-[#7c3aed] !text-white";
  const iconBase = "w-5 h-5";
  const iconWrapBase =
    "shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ring-1 ring-skin-border/20 bg-skin-surface";
  const iconWrapActive =
    "!bg-white !text-[#7c3aed] !ring-white/30 dark:!bg-white";

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
      aria-modal={open || undefined}
      role="dialog"
      aria-labelledby={titleId}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => closePanel(true)}
        style={{
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
        }}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "absolute right-0 top-0 h-full w-full sm:w-[420px] lg:w-[520px] bg-skin-surface ring-1 ring-skin-border/15 shadow-2xl transition-transform duration-300 ease-out flex flex-col focus:outline-none",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
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

        <div className="p-3 sm:p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {ITEMS.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Lock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm text-slate-500 px-10">
                Vous n'avez pas encore reçu d'accords d'accès pour les sections
                de gestion.
              </p>
            </div>
          ) : (
            ITEMS.map(({ label, to, Icon, disabled }) => {
              if (disabled) {
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
                        className={`w-4 h-4 ml-auto transition-opacity ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
