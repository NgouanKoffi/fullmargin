// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\MobileDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { HeaderNavGroup, HeaderNavItem } from "./navConfig";
import ThemeToggle from "../ThemeMode";
import {
  Home,
  Info,
  BadgeDollarSign,
  Store,
  Users,
  Search,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Heart,
  MessageSquareText,
  Settings2,
} from "lucide-react";

// 🔹 imports ajoutés pour la Balance
import { useAuth } from "../../auth/AuthContext";
import BalanceChip from "./BalanceChip";
import { useSellerBalance } from "../../pages/marketplace/lib/useSellerBalance";

type Props = {
  open: boolean;
  groups: HeaderNavGroup[];
  onClose: () => void;
};

const tile =
  "bg-white/85 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 text-skin-base ring-1 ring-black/5 dark:ring-white/10 transition-colors";
const FALLBACK_HREF = "/";

const normalizePath = (p: string) => {
  const cleaned = (p || "/").replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
};

const isPathActive = (currentPath: string, targetHref?: string) => {
  if (!targetHref) return false;
  const cur = normalizePath(currentPath);
  const [tgtPath] = targetHref.split("?");
  const tgt = normalizePath(tgtPath || "/");

  if (tgt === "/") return cur === "/";

  return cur === tgt || cur.startsWith(tgt + "/");
};

const isHrefStrictActive = (
  currentPath: string,
  currentSearch: string,
  href?: string
): boolean => {
  if (!href) return false;
  const [tgtPathRaw, tgtSearchRaw] = href.split("?");
  const tgtPath = normalizePath(tgtPathRaw || "/");
  const curPath = normalizePath(currentPath);

  if (curPath !== tgtPath) return false;
  if (!tgtSearchRaw || !tgtSearchRaw.trim()) return true;
  return currentSearch === `?${tgtSearchRaw}`;
};

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center justify-center
        w-8 h-8 rounded-full
        bg-violet-500/12
        dark:bg-white/10
        ring-1 ring-black/5 dark:ring-white/10
        shrink-0
      "
    >
      {children}
    </span>
  );
}

function renderGroupIcon(key: string) {
  switch (key) {
    case "accueil":
      return (
        <IconWrap>
          <Home className="w-4 h-4" />
        </IconWrap>
      );
    case "apropos":
      return (
        <IconWrap>
          <Info className="w-4 h-4" />
        </IconWrap>
      );
    case "tarifs":
      return (
        <IconWrap>
          <BadgeDollarSign className="w-4 h-4" />
        </IconWrap>
      );
    case "faq":
      return (
        <IconWrap>
          <CircleHelp className="w-4 h-4" />
        </IconWrap>
      );
    case "boutiques":
      return (
        <IconWrap>
          <Store className="w-4 h-4" />
        </IconWrap>
      );
    case "communautes":
      return (
        <IconWrap>
          <Users className="w-4 h-4" />
        </IconWrap>
      );
    case "mes-outils":
      return (
        <IconWrap>
          <Settings2 className="w-4 h-4" />
        </IconWrap>
      );
    default:
      return null;
  }
}

function renderSubIcon(groupKey: string, label: string) {
  if (groupKey === "boutiques") {
    switch (label) {
      case "FM marketplace":
        return <Store className="w-4 h-4" />;
      case "Dashboard":
        return <LayoutDashboard className="w-4 h-4" />;
      case "Mes achats":
        return <Package className="w-4 h-4" />;
      case "Panier":
        return <ShoppingCart className="w-4 h-4" />;
      case "Favoris":
        return <Heart className="w-4 h-4" />;
      case "Ma boutique":
      case "Créer ma boutique":
        return <Store className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  }

  if (groupKey === "communautes") {
    switch (label) {
      case "Fil d’actualités":
        return <MessageSquareText className="w-4 h-4" />;
      case "Mon espace":
        return <Settings2 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  }

  // fallback minimaliste
  return <span className="w-2 h-2 rounded-full bg-current/80" />;
}

// 👇 clés protégées (Mes outils)
const TOOL_PROTECTED_KEYS = new Set<string>([
  "tools-notes",
  "tools-tasks",
  "tools-finances",
  "tools-journal",
  "tools-fullmetrix",
  "tools-podcasts",
]);

export default function MobileDrawer({ open, groups, onClose }: Props) {
  const { pathname, search } = useLocation();

  // 🔹 même logique d'auth que DesktopActions
  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  const openAuth = (mode: "signin" | "signup" = "signin") => {
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } })
    );
  };

  // 🔹 même hook que sur le desktop pour charger les soldes
  const { loading: balLoading, bal } = useSellerBalance();
  const sellerAvailable = bal?.available ?? 0;
  const communityAvailable = bal?.community ?? 0;
  const affiliationAvailable = bal?.affiliation ?? 0;
  const sellerCurrency = (bal?.currency || "USD").toUpperCase();

  const initialExpanded: Record<string, boolean> = useMemo(() => {
    const base: Record<string, boolean> = {};
    for (const g of groups) {
      const hasActiveChild =
        g.items?.some((it) => isHrefStrictActive(pathname, search, it.href)) ??
        false;
      base[g.key] = hasActiveChild;
    }
    return base;
  }, [pathname, search, groups]);

  const [expanded, setExpanded] =
    useState<Record<string, boolean>>(initialExpanded);

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        const hasActiveChild =
          g.items?.some((it) =>
            isHrefStrictActive(pathname, search, it.href)
          ) ?? false;
        if (hasActiveChild) next[g.key] = true;
      }
      return next;
    });
  }, [pathname, search, groups]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggle = (key: string) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("fm:open-search"));
    onClose();
  };

  if (!open) return null;

  const dropdownCard =
    "mx-2 mt-1 rounded-2xl ring-1 ring-skin-border/15 bg-white/100 dark:bg-[#13151b]/100 backdrop-blur-md shadow-xl overflow-hidden";
  const dropdownItem =
    "flex items-center gap-3 px-3.5 py-3 text-[15px] transition-colors";

  return createPortal(
    <div
      id="mobile-drawer"
      className="min-[1175px]:hidden fixed inset-x-0 top-16 bottom-0 z-[130] bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-md transition-transform"
      role="region"
      aria-label="Menu mobile"
    >
      <div
        className="
          mx-auto max-w-7xl px-3 sm:px-6 py-3 space-y-2
          h-full overflow-y-auto overscroll-contain
          pb-[max(16px,env(safe-area-inset-bottom))] no-scrollbar
        "
      >
        {/* recherche (mobile très étroit, ≤ 370px) */}
        <button
          type="button"
          onClick={openSearch}
          className={`hidden max-[370px]:block w-full rounded-2xl px-4 py-3 text-sm ${tile}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring`}
        >
          <div className="flex items-center gap-3">
            <IconWrap>
              <Search className="w-4 h-4" />
            </IconWrap>
            <span className="truncate flex items-center gap-1">Rechercher</span>
          </div>
        </button>

        {/* 🔥 Balance FM — visible uniquement ≤ 370px */}
        {isAuthed && (
          <div className="hidden max-[370px]:flex w-full">
            <BalanceChip
              marketplace={sellerAvailable}
              community={communityAvailable}
              affiliation={affiliationAvailable}
              currency={sellerCurrency}
              size="md"
              loading={balLoading}
              className="w-full justify-between"
            />
          </div>
        )}

        {groups.map((g) => {
          const hasChildren = Array.isArray(g.items) && g.items.length > 0;

          // ===== liens simples =====
          if (!hasChildren) {
            const to =
              g.href && g.href.trim().length > 0 ? g.href : FALLBACK_HREF;
            const isActive = isPathActive(pathname, to);
            return (
              <Link
                key={g.key}
                to={to}
                onClick={() => onClose()}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "block rounded-2xl px-4 py-3 text-sm bg-violet-600 text-white ring-1 ring-violet-500/70"
                    : `block rounded-2xl px-4 py-3 text-sm ${tile}`
                }
              >
                <div className="flex items-center gap-3">
                  {renderGroupIcon(g.key)}
                  <span className="truncate flex items-center gap-1">
                    {g.label}
                  </span>
                  {g.badge ? (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[1.35rem] px-1.5 h-5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                      {g.badge > 99 ? "99+" : g.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          }

          // ===== groupes avec sous-menus =====
          const isOpen = expanded[g.key];
          const hasActiveChild =
            g.items?.some((it) =>
              isHrefStrictActive(pathname, search, it.href)
            ) ?? false;
          const parentActive =
            (g.href && isPathActive(pathname, g.href)) || hasActiveChild;

          return (
            <div key={g.key} className="rounded-2xl">
              <button
                type="button"
                onClick={() => toggle(g.key)}
                aria-expanded={isOpen}
                className={
                  parentActive
                    ? `w-full rounded-2xl px-4 py-3 text-sm bg-violet-600 text-white flex items-center gap-3 relative`
                    : `w-full rounded-2xl px-4 py-3 text-sm ${tile} flex items-center gap-3 relative`
                }
              >
                {renderGroupIcon(g.key)}
                <span className="truncate flex items-center gap-1">
                  {g.label}
                </span>
                <ChevronDown
                  className={`ml-auto w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
                {g.badge ? (
                  <span className="absolute right-12 min-w-[1.3rem] h-5 px-1.5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-semibold">
                    {g.badge > 99 ? "99+" : g.badge}
                  </span>
                ) : null}
              </button>

              {isOpen && (
                <div className={dropdownCard} aria-label={g.label}>
                  <ul className="divide-y divide-skin-border/10">
                    {g.items?.map((it: HeaderNavItem) => {
                      const to =
                        it.href && it.href.trim().length
                          ? it.href
                          : FALLBACK_HREF;
                      const isActive = isHrefStrictActive(pathname, search, to);
                      const isProtectedTool = TOOL_PROTECTED_KEYS.has(it.key);

                      return (
                        <li key={it.key}>
                          <Link
                            to={to}
                            onClick={(e) => {
                              if (!isAuthed && isProtectedTool) {
                                e.preventDefault();
                                e.stopPropagation();
                                openAuth("signin");
                                return;
                              }
                              onClose();
                            }}
                            aria-current={isActive ? "page" : undefined}
                            className={`${dropdownItem} ${
                              isActive
                                ? "bg-violet-600 text-white"
                                : "text-skin-base/90 hover:text-skin-base hover:bg-black/5 dark:hover:bg-white/10"
                            }`}
                          >
                            <span
                              className="
                                inline-flex items-center justify-center
                                w-9 h-9 rounded-full
                                bg-violet-500/10
                                dark:bg-white/10
                                ring-1 ring-black/5 dark:ring-white/10
                                shrink-0
                              "
                            >
                              {/* icône : priorité au it.icon, sinon fallback label */}
                              {it.icon ?? renderSubIcon(g.key, it.label)}
                            </span>
                            <span className="truncate flex-1">{it.label}</span>
                            {it.badge ? (
                              <span className="inline-flex items-center justify-center min-w-[1.2rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                                {it.badge > 99 ? "99+" : it.badge}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        {/* apparence */}
        <div
          className={`mt-2 rounded-2xl px-4 py-3 flex items-center justify-between ${tile}
                      focus-within:ring-2 focus-within:ring-skin-ring`}
        >
          <div className="flex items-center gap-3">
            <IconWrap>
              <span className="block w-3 h-3 rounded-full bg-current opacity-60" />
            </IconWrap>
            <div>
              <div className="text-sm font-medium text-skin-base">
                Apparence
              </div>
              <div className="text-xs text-skin-muted">Clair / Sombre</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>,
    document.body
  );
}
