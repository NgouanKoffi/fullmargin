// src/components/Header/index.tsx
import { useEffect, useState } from "react";
import logo from "../../assets/images/favicon.webp";
import { BREAKPOINT, NAV } from "./constants";
import LogoBrand from "./LogoBrand";
import DesktopNav from "./DesktopNav";
import DesktopActions from "./DesktopActions";
import MobileHamburger from "./MobileHamburger";
import MobileDrawer from "./MobileDrawer";
import { QuickLauncherSheet } from "./sheets";
import SectionsDock from "./Sections";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import AccountQuickModal from "./modals/AccountQuickModal";
import MessagesMount from "../messages/MessagesMount";
import { API_BASE as RAW_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

function useIsMobile(breakpoint: number) {
  const getIsMobile = () =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${breakpoint - 1}px)`).matches
      : true;

  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width:${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

// petit util pour normaliser l’URL API
const API_BASE = RAW_BASE.replace(/\/+$/, "");

// headers d’auth
function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// pour éviter les 404 entre /communaute/ et /communautes/
function pathVariants(p: string): string[] {
  const a = p.replace("/communautes/", "/communaute/");
  const b = p.replace("/communaute/", "/communautes/");
  return Array.from(new Set([p, a, b]));
}

async function fetchWithFallback(
  paths: string[],
  init: RequestInit = {}
): Promise<Response> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        cache: "no-store",
        credentials: "include",
        ...init,
        headers: {
          ...(init.headers || {}),
          "Cache-Control": "no-store",
        },
      });
      if (res.status !== 404) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) {
    return new Response("Network error", { status: 599 });
  }
  return new Response("Not Found", { status: 404 });
}

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [accountQuickOpen, setAccountQuickOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // 👇 compteurs notifs communautés (ce que voit le header)
  const [communityOwnerPendingCount, setCommunityOwnerPendingCount] =
    useState(0);
  const [communityMyPendingCount, setCommunityMyPendingCount] = useState(0);

  const isMobile = useIsMobile(BREAKPOINT);

  const { status, user, signOut } = useAuth();
  const isGuest = status !== "authenticated";
  const avatarSrc = !isGuest && user?.avatarUrl ? user.avatarUrl : "";

  const navigate = useNavigate();

  const onSignOut = () => {
    signOut();
  };

  // header shadow on scroll
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // reset padding-bottom legacy
  useEffect(() => {
    document.body.style.paddingBottom = "";
    if (!isMobile) setMobileMenu(false);
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [isMobile]);

  // quand on change de mode, on ferme ce qui est pas du mode
  useEffect(() => {
    if (isMobile) {
      setAccountOpen(false);
    } else {
      setLauncherOpen(false);
      setMobileMenu(false);
    }
  }, [isMobile]);

  // Support FAB (événements globaux)
  useEffect(() => {
    const open = () => setSupportOpen(true);
    const close = () => setSupportOpen(false);
    window.addEventListener("fm:open-support", open as EventListener);
    window.addEventListener("fm:close-support", close as EventListener);
    return () => {
      window.removeEventListener("fm:open-support", open as EventListener);
      window.removeEventListener("fm:close-support", close as EventListener);
    };
  }, []);

  // Scroll lock overlay (sheets mobiles)
  useEffect(() => {
    const hasSheetModal = isMobile && launcherOpen;
    document.body.style.overflow = hasSheetModal ? "hidden" : "";

    const hideFab = supportOpen || hasSheetModal || mobileMenu;
    if (hideFab)
      document.documentElement.setAttribute("data-hide-support", "true");
    else document.documentElement.removeAttribute("data-hide-support");

    return () => {
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-hide-support");
    };
  }, [supportOpen, launcherOpen, mobileMenu, isMobile]);

  // Intercepter /connexion & /inscription (desktop) → ouvrir modal auth
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (isMobile) return;
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest(
        'a[href="/connexion"], a[href="/inscription"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;

      ev.preventDefault();
      const href = a.getAttribute("href") || "";
      const mode = href.includes("inscription") ? "signup" : "signin";

      setAccountOpen(false);
      setMobileMenu(false);

      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode } })
      );
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [isMobile]);

  // Fermer le sheet si le drawer s'ouvre (UX mobile)
  useEffect(() => {
    if (!isMobile) return;
    if (mobileMenu) setLauncherOpen(false);
  }, [mobileMenu, isMobile]);

  // ✅ modal compte “quick” (on ferme le drawer avant)
  useEffect(() => {
    const openQuick = () => {
      setMobileMenu(false);
      setAccountQuickOpen(true);
    };
    const closeQuick = () => setAccountQuickOpen(false);
    window.addEventListener(
      "fm:open-account-quick",
      openQuick as EventListener
    );
    window.addEventListener(
      "fm:close-account-quick",
      closeQuick as EventListener
    );
    return () => {
      window.removeEventListener(
        "fm:open-account-quick",
        openQuick as EventListener
      );
      window.removeEventListener(
        "fm:close-account-quick",
        closeQuick as EventListener
      );
    };
  }, []);

  // ouvrir / fermer le menu compte depuis ailleurs
  useEffect(() => {
    const open = () => setAccountOpen(true);
    const close = () => setAccountOpen(false);
    window.addEventListener("fm:open-account-dock", open as EventListener);
    window.addEventListener("fm:close-account-dock", close as EventListener);
    return () => {
      window.removeEventListener("fm:open-account-dock", open as EventListener);
      window.removeEventListener(
        "fm:close-account-dock",
        close as EventListener
      );
    };
  }, []);

  // ouvrir / fermer le QuickLauncherSheet
  useEffect(() => {
    const openLauncher = () => {
      setMobileMenu(false);
      setLauncherOpen(true);
    };
    const closeLauncher = () => setLauncherOpen(false);
    window.addEventListener("fm:open-launcher", openLauncher as EventListener);
    window.addEventListener(
      "fm:close-launcher",
      closeLauncher as EventListener
    );
    return () => {
      window.removeEventListener(
        "fm:open-launcher",
        openLauncher as EventListener
      );
      window.removeEventListener(
        "fm:close-launcher",
        closeLauncher as EventListener
      );
    };
  }, []);

  // search → ferme drawer
  useEffect(() => {
    const onOpenSearch = () => {
      setMobileMenu(false);
    };
    window.addEventListener("fm:open-search", onOpenSearch as EventListener);
    return () => {
      window.removeEventListener(
        "fm:open-search",
        onOpenSearch as EventListener
      );
    };
  }, []);

  const hasSheetOverlay = isMobile && launcherOpen;

  // 🔴🔴🔴 ICI : on va chercher les compteurs de demandes (vraie route)
  useEffect(() => {
    let stopped = false;

    async function loadCounts() {
      if (status !== "authenticated") {
        if (!stopped) {
          setCommunityOwnerPendingCount(0);
          setCommunityMyPendingCount(0);
        }
        return;
      }

      try {
        const res = await fetchWithFallback(
          pathVariants("/communaute/requests/counters"),
          { headers: { ...authHeaders() } }
        );
        if (!res.ok) {
          if (!stopped) {
            setCommunityOwnerPendingCount(0);
            setCommunityMyPendingCount(0);
          }
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { myPending?: number; ownerPending?: number };
        };
        const nextMy = json?.data?.myPending ?? 0;
        const nextOwner = json?.data?.ownerPending ?? 0;

        if (!stopped) {
          setCommunityMyPendingCount(nextMy);
          setCommunityOwnerPendingCount(nextOwner);
        }
      } catch {
        if (!stopped) {
          setCommunityMyPendingCount(0);
          setCommunityOwnerPendingCount(0);
        }
      }
    }

    loadCounts();

    // on écoute les events envoyés par CommunityDetails / DemandesTab
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { myPending?: number; ownerPending?: number }
        | undefined;
      if (!detail) return;
      setCommunityMyPendingCount(detail.myPending ?? 0);
      setCommunityOwnerPendingCount(detail.ownerPending ?? 0);
    };

    const onMarkRead = () => {
      setCommunityMyPendingCount(0);
    };

    window.addEventListener(
      "fm:community-req-counters",
      onSync as EventListener
    );
    window.addEventListener(
      "fm:community-req-mark-read",
      onMarkRead as EventListener
    );

    return () => {
      stopped = true;
      window.removeEventListener(
        "fm:community-req-counters",
        onSync as EventListener
      );
      window.removeEventListener(
        "fm:community-req-mark-read",
        onMarkRead as EventListener
      );
    };
  }, [status]);

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${
        elevated ? "shadow-header dark:shadow-headerDark" : ""
      }`}
      role="banner"
    >
      <style>{`
        .sheet{transform:translateY(100%);transition:transform 320ms cubic-bezier(.22,.8,.3,1);will-change:transform}
        .sheet--open{transform:translateY(0)}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        [data-hide-support="true"] .fm-support-fab{ display:none !important; }
      `}</style>

      <div className="supports-[backdrop-filter]:bg-skin-header/55 bg-skin-header/90 backdrop-blur-xl transition-colors">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="h-16 grid grid-cols-[auto_1fr_auto] items-center">
            <LogoBrand logoSrc={logo} />
            <div className="justify-self-center">
              <DesktopNav
                nav={NAV}
                authStatus={status}
                communityOwnerPendingCount={communityOwnerPendingCount}
                communityMyPendingCount={communityMyPendingCount}
              />
            </div>
            <div className="flex items-center gap-2 justify-self-end">
              <DesktopActions
                marketOpen={false}
                accountOpen={accountOpen}
                communityOpen={false}
                onOpenMarket={() => {}}
                onCloseMarket={() => {}}
                onOpenAccount={() => setAccountOpen(true)}
                onCloseAccount={() => setAccountOpen(false)}
                onOpenCommunity={() => {}}
                onCloseCommunity={() => {}}
                avatarSrc={avatarSrc || logo}
                onOpenAccountModal={() =>
                  window.dispatchEvent(new Event("fm:open-account-quick"))
                }
              />

              <MobileHamburger
                open={mobileMenu}
                toggle={() => setMobileMenu((v) => !v)}
                avatarSrc={avatarSrc || logo}
                onOpenLauncher={() => {
                  setMobileMenu(false);
                  setLauncherOpen(true);
                }}
                onOpenAccountModal={() =>
                  window.dispatchEvent(new Event("fm:open-account-quick"))
                }
                // 👇 on envoie le total au bouton
                communityBadgeCount={
                  (communityOwnerPendingCount || 0) +
                  (communityMyPendingCount || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Drawer mobile */}
        <MobileDrawer
          open={mobileMenu}
          nav={NAV}
          onClose={() => setMobileMenu(false)}
          communityOwnerPendingCount={communityOwnerPendingCount}
          communityMyPendingCount={communityMyPendingCount}
        />
      </div>

      {/* Overlay mobile */}
      {hasSheetOverlay && (
        <div
          className="fixed inset-0 z-[60] bg-black/70"
          onClick={() => {
            setLauncherOpen(false);
            setSupportOpen(false);
          }}
        />
      )}

      {/* Quick launcher */}
      <QuickLauncherSheet
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        onPick={(target) => {
          if (target === "market") {
            navigate("/marketplace/dashboard?tab=dashboard");
            setLauncherOpen(false);
          } else if (target === "community") {
            navigate("/communautes/dashboard?tab=feed");
            setLauncherOpen(false);
          } else {
            navigate("/profil");
            setLauncherOpen(false);
          }
        }}
      />

      {/* Modal “Compte” */}
      <AccountQuickModal
        open={accountQuickOpen}
        onClose={() => setAccountQuickOpen(false)}
        avatarSrc={avatarSrc || logo}
        onGoProfile={() => navigate("/profil")}
        onSignOut={onSignOut}
      />

      {/* Dock desktop */}
      <SectionsDock
        marketOpen={false}
        accountOpen={accountOpen}
        communityOpen={false}
        onCloseMarket={() => {}}
        onCloseAccount={() => setAccountOpen(false)}
        onCloseCommunity={() => {}}
        avatarSrc={avatarSrc || logo}
      />

      {/* Messages */}
      <MessagesMount />
    </header>
  );
}
