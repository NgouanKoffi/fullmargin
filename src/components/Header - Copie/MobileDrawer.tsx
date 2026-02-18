// src/components/Header/MobileDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { Group, SimpleKey, LinkItem } from "./types";
import ThemeToggle from "../ThemeMode";
import {
  Home,
  Info,
  BadgeDollarSign,
  Store,
  Users,
  Search,
  ChevronDown,
  ShoppingCart,
  Heart,
  Package,
  Settings2,
  MessageSquareText,
  LayoutDashboard,
  CircleHelp,
} from "lucide-react";
import { ActiveLink } from "./ui/ActiveLink";
import { useAuth } from "../../auth/AuthContext";
import BalanceChip from "./BalanceChip";
import { useSellerBalance } from "../../pages/marketplace/lib/useSellerBalance";
import { useShopStatus } from "../../pages/marketplace/lib/useShopStatus";

type Props = {
  open: boolean;
  nav: Group[];
  onClose: () => void;
  // 👇 mêmes compteurs que sur desktop
  communityOwnerPendingCount?: number;
  communityMyPendingCount?: number;
};

const tile =
  "bg-white/85 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 text-skin-base ring-1 ring-black/5 dark:ring-white/10 transition-colors";
const FALLBACK_HREF = "/";

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

function renderIconFor(key: SimpleKey) {
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
    default:
      return null;
  }
}

/** Flag session (fallback) */
function hasShopFromSession(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}

/** icône pour les sous-items */
function iconForSub(groupKey: SimpleKey, label: string) {
  if (groupKey === "boutiques") {
    switch (label) {
      case "FM marketplace":
      case "Ma boutique":
      case "Créer ma boutique":
        return <Store className="w-4 h-4" />;
      case "Dashboard":
        return <LayoutDashboard className="w-4 h-4" />;
      case "Mes achats":
        return <Package className="w-4 h-4" />;
      case "Ventes":
        return <BadgeDollarSign className="w-4 h-4" />;
      case "Panier":
        return <ShoppingCart className="w-4 h-4" />;
      case "Favoris":
        return <Heart className="w-4 h-4" />;
      default:
        return null;
    }
  }
  if (groupKey === "communautes") {
    switch (label) {
      case "Fil d’actualités":
        return <MessageSquareText className="w-4 h-4" />;
      case "Mon espace":
        return <Settings2 className="w-4 h-4" />;
      default:
        return null;
    }
  }
  return null;
}

/** Utils route active */
const normalizePath = (p: string) => (p || "/").replace(/\/+$/, "");
function isPathActive(currentPath: string, targetHref?: string) {
  if (!targetHref) return false;
  const cur = normalizePath(currentPath);
  const [raw] = targetHref.split("?");
  const tgt = normalizePath(raw || "/");
  return cur === tgt || cur.startsWith(tgt + "/");
}

/** ✅ Match strict amélioré */
const isHrefStrictActive = (
  pathname: string,
  search: string,
  href?: string
): boolean => {
  if (!href) return false;
  const [tgtPathRaw, tgtSearchRaw] = href.split("?");
  const tgtPath = normalizePath(tgtPathRaw || "/");
  const curPath = normalizePath(pathname);
  if (curPath !== tgtPath) return false;
  if (!tgtSearchRaw || tgtSearchRaw.trim() === "") return true;
  const tgtSearch = `?${tgtSearchRaw}`;
  return search === tgtSearch;
};

/** Ouvre l’auth en mémorisant la destination voulue */
function openAuthWithFrom(to?: string, mode: "signin" | "signup" = "signin") {
  try {
    const href =
      (to && to.trim()) ||
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", href);
    localStorage.setItem("fm:oauth:open", "account");
  } catch {
    // noop
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

/** ✅ lit le slug de ma communauté */
function getMyCommunitySlug(): string {
  try {
    return sessionStorage.getItem("fm:community:my-slug") || "";
  } catch {
    return "";
  }
}

export default function MobileDrawer({
  open,
  nav,
  onClose,
  communityOwnerPendingCount = 0,
  communityMyPendingCount = 0,
}: Props) {
  const { pathname, search } = useLocation();
  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  // 💰 Solde vendeur
  const { loading: balLoading, bal } = useSellerBalance();

  const sellerAvailable = bal?.available ?? 0;
  const communityAvailable = bal?.community ?? 0;
  const affiliationAvailable = bal?.affiliation ?? 0;
  const sellerCurrency = (bal?.currency || "USD").toUpperCase();

  // ✅ boutique
  const { hasShop, loading: shopLoading } = useShopStatus();

  useEffect(() => {
    try {
      if (shopLoading) return;
      sessionStorage.setItem("fm:shop:exists", hasShop ? "1" : "0");
      window.dispatchEvent(new Event("fm:shop:changed"));
    } catch {
      // noop
    }
  }, [hasShop, shopLoading]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(
        "data-fm-auth",
        isAuthed ? "1" : "0"
      );
    }
  }, [isAuthed]);

  const groups = nav.filter(
    (
      g
    ): g is Extract<
      Group,
      { key: SimpleKey; label: string; href: string; items?: LinkItem[] }
    > => g.key !== "marketplace"
  );

  const dropdownKeys: SimpleKey[] = useMemo(
    () => ["boutiques", "communautes"],
    []
  );

  const isOnCommunityDetail = /^\/communaute\/[^/]+(?:\/.*)?$/.test(pathname);

  const groupHasActiveChild = (g: {
    key: SimpleKey;
    items?: LinkItem[];
  }): boolean => {
    if (g.key === "communautes" && isOnCommunityDetail) return true;
    if (!g.items || g.items.length === 0) return false;
    return g.items.some((it) => isPathActive(pathname, it.href));
  };

  const initialExpanded: Record<SimpleKey, boolean> = useMemo(() => {
    const base: Record<SimpleKey, boolean> = {
      boutiques: false,
      communautes: false,
      accueil: false,
      tarifs: false,
      apropos: false,
      faq: false,
    };
    for (const g of groups) {
      if (dropdownKeys.includes(g.key) && groupHasActiveChild(g)) {
        base[g.key] = true;
      }
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groups]);

  const [expanded, setExpanded] =
    useState<Record<SimpleKey, boolean>>(initialExpanded);

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (dropdownKeys.includes(g.key) && groupHasActiveChild(g)) {
          next[g.key] = true;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = (key: SimpleKey, lockedOpen: boolean) => {
    if (lockedOpen) return;
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("fm:open-search"));
    onClose();
  };

  if (!open) return null;

  const mySlug = getMyCommunitySlug();
  const myCommunityPath = mySlug ? normalizePath(`/communaute/${mySlug}`) : "";

  const BOUTIQUES_ORDER = [
    "FM marketplace",
    "Mes achats",
    "Ventes",
    "Panier",
    "Favoris",
    "Ma boutique",
    "Créer ma boutique",
    "Dashboard",
  ];

  // 👇 total notif communautés
  const communityTotalBadge =
    (communityOwnerPendingCount || 0) + (communityMyPendingCount || 0);

  const dropdownCard =
    "mx-2 mt-1 rounded-2xl ring-1 ring-skin-border/15 bg-white/100 dark:bg-[#13151b]/100 backdrop-blur-md shadow-xl overflow-hidden";
  const dropdownItem =
    "flex items-center gap-3 px-3.5 py-3 text-[15px] transition-colors";

  return createPortal(
    <div
      id="mobile-drawer"
      className="
        min-[1170px]:hidden
        fixed inset-x-0 top-16 bottom-0
        z-[120]
        bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-md
        transition-transform
      "
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
        {isAuthed && (
          <div className="px-1 min-[540px]:hidden">
            <BalanceChip
              marketplace={sellerAvailable}
              community={communityAvailable}
              affiliation={affiliationAvailable}
              currency={sellerCurrency}
              size="sm"
              loading={balLoading}
            />
          </div>
        )}

        {/* 🔎 RECHERCHE */}
        <button
          type="button"
          onClick={openSearch}
          className={`hidden max-[515px]:block w-full rounded-2xl px-4 py-3 text-sm ${tile}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring`}
        >
          <div className="flex items-center gap-3">
            <IconWrap>
              <Search className="w-4 h-4" />
            </IconWrap>
            <span className="truncate flex items-center gap-1">Rechercher</span>
          </div>
        </button>

        {/* NAVIGATION */}
        {groups.map((g) => {
          const isDropdown =
            g.items &&
            g.items.length > 0 &&
            (g.key === "boutiques" || g.key === "communautes");

          if (!isDropdown) {
            const to =
              g.href && g.href.trim().length > 0 ? g.href : FALLBACK_HREF;
            return (
              <ActiveLink
                key={`${g.key}-${g.label}`}
                to={to}
                end={to === "/"}
                base={`block rounded-2xl px-4 py-3 text-sm`}
                hover={tile}
                onClick={() => onClose()}
              >
                <div className="flex items-center gap-3">
                  {renderIconFor(g.key)}
                  <span className="truncate flex items-center gap-1">
                    {g.label}
                  </span>
                </div>
              </ActiveLink>
            );
          }

          const lockedOpen = (g.items || []).some((it) =>
            isPathActive(pathname, it.href)
          );
          const isOpen = expanded[g.key] || lockedOpen;

          let normalizedItems: LinkItem[] = (g.items || []).filter(
            (it) => it.label !== "Gérer ma communauté"
          );

          if (g.key === "boutiques") {
            const ensureLabel = (
              label: string,
              href: string,
              toStart = false
            ) => {
              if (!normalizedItems.some((it) => it.label === label)) {
                if (toStart) normalizedItems.unshift({ label, href });
                else normalizedItems.push({ label, href });
              }
            };
            ensureLabel(
              "Dashboard",
              "/marketplace/dashboard?tab=dashboard",
              true
            );

            const hasShopSafe = shopLoading ? hasShopFromSession() : !!hasShop;

            normalizedItems = normalizedItems.filter(
              (it) => it.label !== "Retrait"
            );
            normalizedItems = normalizedItems
              .map((it) => {
                if (it.label === "Ma boutique" && (!isAuthed || !hasShopSafe)) {
                  return { ...it, label: "Créer ma boutique" };
                }
                return it;
              })
              .filter((it) => {
                if (it.label === "Ventes" && (!isAuthed || !hasShopSafe))
                  return false;
                return true;
              });

            normalizedItems = [...normalizedItems].sort((a, b) => {
              const ia = BOUTIQUES_ORDER.indexOf(a.label);
              const ib = BOUTIQUES_ORDER.indexOf(b.label);
              const ra = ia === -1 ? 999 : ia;
              const rb = ib === -1 ? 999 : ib;
              return ra - rb;
            });
          }

          const isCommunitiesGroup = g.key === "communautes";
          const showGroupBadge = isCommunitiesGroup && communityTotalBadge > 0;

          return (
            <div key={`${g.key}-${g.label}`} className="rounded-2xl">
              <button
                type="button"
                onClick={() => toggle(g.key, lockedOpen)}
                aria-expanded={isOpen}
                className={`w-full rounded-2xl px-4 py-3 text-sm ${tile}
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                            flex items-center gap-3 relative`}
              >
                {renderIconFor(g.key)}
                <span className="truncate flex items-center gap-1">
                  {g.label}
                </span>
                <ChevronDown
                  className={`ml-auto w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
                {showGroupBadge ? (
                  <span className="absolute top-1.5 right-8 min-w-[1.3rem] h-5 px-1.5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-semibold">
                    {communityTotalBadge > 99 ? "99+" : communityTotalBadge}
                  </span>
                ) : null}
              </button>

              {isOpen && (
                <div className={dropdownCard} aria-label={g.label}>
                  <ul className="divide-y divide-skin-border/10">
                    {normalizedItems.map((it) => {
                      const to =
                        it.href && it.href.trim().length
                          ? it.href
                          : FALLBACK_HREF;

                      const needsAuthMarket =
                        g.key === "boutiques" &&
                        [
                          "Dashboard",
                          "Ma boutique",
                          "Créer ma boutique",
                          "Mes achats",
                          "Ventes",
                          "Panier",
                          "Favoris",
                          "FM marketplace",
                        ].includes(it.label);

                      const communityProtectedByLabel =
                        g.key === "communautes" &&
                        ["Mon espace"].includes(it.label);

                      const communityProtectedByHref =
                        g.key === "communautes" &&
                        /^\/communaute\/private(\/|$)/.test(to || "");

                      const isCommunityFeed =
                        g.key === "communautes" &&
                        it.label === "Fil d’actualités";

                      let needsAuth =
                        needsAuthMarket ||
                        communityProtectedByLabel ||
                        communityProtectedByHref;

                      if (isCommunityFeed) {
                        needsAuth = false;
                      }

                      const needsShop =
                        g.key === "boutiques" &&
                        ["Ma boutique", "Ventes"].includes(it.label);

                      const isMonEspaceItem =
                        g.key === "communautes" && it.label === "Mon espace";
                      const childActive = isMonEspaceItem
                        ? normalizePath(pathname) === myCommunityPath
                        : isHrefStrictActive(pathname, search, to);

                      const onItemClick: React.MouseEventHandler<
                        HTMLAnchorElement
                      > = (e) => {
                        if (needsAuth && !isAuthed) {
                          e.preventDefault();
                          openAuthWithFrom(to, "signin");
                          onClose();
                          return;
                        }
                        if (needsShop && !hasShopFromSession()) {
                          e.preventDefault();
                          openAuthWithFrom(to, "signin");
                          onClose();
                          return;
                        }
                        onClose();
                      };

                      // 👇 badge sur “Mon espace”
                      const showSubBadge =
                        isCommunitiesGroup &&
                        it.label === "Mon espace" &&
                        communityTotalBadge > 0;

                      return (
                        <li key={`${g.key}-${it.label}`}>
                          <Link
                            to={to}
                            onClick={onItemClick}
                            aria-current={childActive ? "page" : undefined}
                            className={`${dropdownItem} ${
                              childActive
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
                              {iconForSub(g.key, it.label)}
                            </span>
                            <span className="truncate flex-1">{it.label}</span>
                            {showSubBadge ? (
                              <span className="inline-flex items-center justify-center min-w-[1.2rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                                {communityTotalBadge > 99
                                  ? "99+"
                                  : communityTotalBadge}
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

        {/* APPARENCE */}
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
