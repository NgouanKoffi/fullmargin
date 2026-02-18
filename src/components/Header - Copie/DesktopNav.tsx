// src/components/Header/DesktopNav.tsx
import {
  ChevronDown,
  Store,
  ShoppingCart,
  Heart,
  Package,
  BadgeDollarSign,
  MessageSquareText,
  Settings2,
  LayoutDashboard,
} from "lucide-react";
import type { Group, SimpleKey, LinkItem } from "./types";
import { ActiveLink } from "./ui/ActiveLink";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useShopStatus } from "../../pages/marketplace/lib/useShopStatus";

type AuthStatus = "authenticated" | "anonymous" | "loading";

type Props = {
  nav: Group[];
  authStatus: AuthStatus;
  // valeurs qui viennent du parent au premier rendu
  communityOwnerPendingCount?: number;
  communityMyPendingCount?: number;
};

const FALLBACK_HREF = "/";

function isSimpleGroup(
  g: Group
): g is Extract<
  Group,
  { key: SimpleKey; label: string; href: string; items?: LinkItem[] }
> {
  return g.key !== "marketplace";
}

/** icône pour items des menus Boutiques / Communautés */
function iconFor(groupKey: SimpleKey, label: string) {
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

const normalizePath = (p: string) => (p || "/").replace(/\/+$/, "");
const isPathActive = (currentPath: string, targetHref?: string) => {
  if (!targetHref) return false;
  const cur = normalizePath(currentPath);
  const [tgtPath] = targetHref.split("?");
  const tgt = normalizePath(tgtPath || "/");
  return cur === tgt || cur.startsWith(tgt + "/");
};

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

function hasShopFromSession(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}

function openAuthWithFrom(to?: string, mode: "signin" | "signup" = "signin") {
  try {
    const href =
      (to && to.trim()) ||
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", href);
    localStorage.setItem("fm:oauth:open", "account");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

const parentActiveCls =
  "bg-violet-600 text-white ring-2 ring-violet-700 shadow-[0_0_0_3px_rgba(109,40,217,0.25)]";

/* ✅ lit le slug de ma communauté (si connu) */
function getMyCommunitySlug(): string {
  try {
    return sessionStorage.getItem("fm:community:my-slug") || "";
  } catch {
    return "";
  }
}

export default function DesktopNav({
  nav,
  authStatus,
  communityOwnerPendingCount = 0,
  communityMyPendingCount = 0,
}: Props) {
  const groups = nav.filter(isSimpleGroup);
  const isAuthed = authStatus === "authenticated";
  const { pathname, search } = useLocation();

  // source principale shop
  const { hasShop, loading: shopLoading } = useShopStatus();

  useEffect(() => {
    try {
      if (shopLoading) return;
      sessionStorage.setItem("fm:shop:exists", hasShop ? "1" : "0");
      window.dispatchEvent(new Event("fm:shop:changed"));
    } catch {
      /* ignore */
    }
  }, [hasShop, shopLoading]);

  const [openKey, setOpenKey] = useState<SimpleKey | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  // 💥 ICI : état local pour le badge communautés
  const [communityCounts, setCommunityCounts] = useState<{
    ownerPending: number;
    myPending: number;
  }>({
    ownerPending: communityOwnerPendingCount || 0,
    myPending: communityMyPendingCount || 0,
  });

  // si le parent change les props → on resynchronise
  useEffect(() => {
    setCommunityCounts({
      ownerPending: communityOwnerPendingCount || 0,
      myPending: communityMyPendingCount || 0,
    });
  }, [communityOwnerPendingCount, communityMyPendingCount]);

  // on écoute les events globaux envoyés par CommunityDetails / DemandesTab
  useEffect(() => {
    const onCounters = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { ownerPending?: number; myPending?: number }
        | undefined;
      if (!detail) return;
      setCommunityCounts({
        ownerPending: detail.ownerPending ?? 0,
        myPending: detail.myPending ?? 0,
      });
    };
    window.addEventListener(
      "fm:community-req-counters",
      onCounters as EventListener
    );

    // quand on dit explicitement “j’ai tout vu”
    const onMarkRead = () => {
      setCommunityCounts((prev) => ({
        ownerPending: prev.ownerPending,
        myPending: 0,
      }));
    };
    window.addEventListener(
      "fm:community-req-mark-read",
      onMarkRead as EventListener
    );

    return () => {
      window.removeEventListener(
        "fm:community-req-counters",
        onCounters as EventListener
      );
      window.removeEventListener(
        "fm:community-req-mark-read",
        onMarkRead as EventListener
      );
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setOpenKey(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleMenu = (key: SimpleKey) => {
    setOpenKey((k) => (k === key ? null : key));
  };

  const hasShopSafe = shopLoading ? hasShopFromSession() : !!hasShop;
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

  // 👇 maintenant le total vient de l’état local (qui écoute les events)
  const communityTotalBadge =
    (communityCounts.ownerPending || 0) + (communityCounts.myPending || 0);

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden min-[1170px]:block"
    >
      <div
        ref={navRef}
        className="
          flex items-center gap-1 rounded-full px-1.5 py-1
          ring-1 ring-skin-border/15
          supports-[backdrop-filter]:bg-skin-header/40 bg-skin-header/60 backdrop-blur-md
          shadow-[0_1px_0_0_rgba(0,0,0,.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,.06)]
        "
      >
        {groups.map((g) => {
          const hasChildren = !!g.items && g.items.length > 0;

          if (!hasChildren) {
            const to = g.href?.trim().length ? g.href : FALLBACK_HREF;
            return (
              <ActiveLink
                key={`${g.key}-${g.label}`}
                to={to}
                end={to === "/"}
                base="rounded-full px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1 text-skin-base/90"
                hover="hover:bg_white/10 dark:hover:bg-white/10 hover:text-skin-base"
              >
                {g.label}
              </ActiveLink>
            );
          }

          const hasActiveChild = (g.items || []).some((it) => {
            if (
              g.key === "communautes" &&
              it.label === "Mon espace" &&
              myCommunityPath
            ) {
              return normalizePath(pathname) === myCommunityPath;
            }
            return isPathActive(pathname, it.href);
          });

          const parentHref = g.href?.trim().length ? g.href : undefined;
          const isParentActive =
            (parentHref && isPathActive(pathname, parentHref)) ||
            hasActiveChild;

          const isOpen = openKey === g.key;

          let normalizedItems: LinkItem[] = g.items || [];

          if (g.key === "boutiques") {
            const ensureLabel = (label: string, href: string) => {
              if (!normalizedItems.some((it) => it.label === label)) {
                normalizedItems.unshift({ label, href });
              }
            };
            ensureLabel("Dashboard", "/marketplace/dashboard?tab=dashboard");
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

          if (g.key === "communautes") {
            normalizedItems = normalizedItems.filter(
              (it) =>
                it.label !== "Ma communauté" && it.label !== "Ma commanaute"
            );
          }

          const isCommunitiesGroup = g.key === "communautes";
          const showGroupBadge = isCommunitiesGroup && communityTotalBadge > 0;

          return (
            <div key={`${g.key}-${g.label}`} className="relative">
              <button
                type="button"
                className={`
                  relative
                  rounded-full px-4 py-2 text-sm
                  text-skin-base/90 hover:text-skin-base
                  transition-colors hover:bg-white/10 dark:hover:bg-white/10
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                  whitespace-nowrap flex items-center gap-1
                  ${isParentActive ? parentActiveCls : ""}
                `}
                aria-haspopup="menu"
                aria-expanded={isOpen ? "true" : "false"}
                aria-current={isParentActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMenu(g.key);
                }}
              >
                {g.label}
                <ChevronDown
                  className={`w-4 h-4 opacity-80 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
                {showGroupBadge ? (
                  <span
                    className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold shadow"
                    aria-label={`${communityTotalBadge} notification(s) communauté`}
                  >
                    {communityTotalBadge > 99 ? "99+" : communityTotalBadge}
                  </span>
                ) : null}
              </button>

              {isOpen && (
                <div
                  role="menu"
                  className="
                    absolute left-0 mt-2 min-w-64
                    rounded-2xl p-2
                    bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md
                    ring-1 ring-black/5 dark:ring-white/10 shadow-xl
                    z-50
                    max-h-[60vh] overflow-y-auto overscroll-contain pr-1
                  "
                  aria-label={`Menu ${g.label}`}
                >
                  {normalizedItems.map((it) => {
                    const to =
                      it.href && it.href.trim().length
                        ? it.href
                        : FALLBACK_HREF;

                    let childActive = isHrefStrictActive(pathname, search, to);
                    if (
                      g.key === "communautes" &&
                      it.label === "Mon espace" &&
                      myCommunityPath
                    ) {
                      childActive = normalizePath(pathname) === myCommunityPath;
                    }

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

                    const onClick: React.MouseEventHandler<
                      HTMLAnchorElement
                    > = (e) => {
                      if (needsAuth && !isAuthed) {
                        e.preventDefault();
                        openAuthWithFrom(to, "signin");
                        setOpenKey(null);
                        return;
                      }
                      if (needsShop && !hasShopSafe) {
                        e.preventDefault();
                        openAuthWithFrom(to, "signin");
                        setOpenKey(null);
                        return;
                      }
                      setOpenKey(null);
                    };

                    const showSubBadge =
                      g.key === "communautes" &&
                      it.label === "Mon espace" &&
                      communityTotalBadge > 0;

                    return (
                      <Link
                        key={`${g.key}-${it.label}`}
                        to={to}
                        onClick={onClick}
                        aria-current={childActive ? "page" : undefined}
                        className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-colors
                          ${
                            childActive
                              ? "bg-violet-600 text-white"
                              : "text-skin-base/90 hover:text-skin-base hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                        role="menuitem"
                      >
                        <span
                          className="
                            inline-flex items-center justify-center
                            w-8 h-8 rounded-full
                            bg-white/80 dark:bg-white/10
                            ring-1 ring-black/5 dark:ring-white/10
                            shrink-0
                          "
                        >
                          {iconFor(g.key, it.label)}
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
