// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\index.tsx
import { useEffect, useMemo, useState } from "react";
import logo from "../../assets/images/favicon.webp";
import { BREAKPOINT } from "./constants";
import LogoBrand from "./LogoBrand";
import DesktopNav from "./DesktopNav";
import DesktopActions from "./DesktopActions";
import MobileHamburger from "./MobileHamburger";
import MobileDrawer from "./MobileDrawer";
import SectionsDock from "./Sections";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import AccountQuickModal from "./modals/AccountQuickModal";
import MessagesMount from "../messages/MessagesMount";
import { API_BASE as RAW_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";
import { buildHeaderNav } from "./navConfig";
import type { HeaderNavGroup } from "./navConfig";
import { useConversations } from "../messages/useConversations";

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

// ===== Types pour les notifs =====

type HeaderNotification = {
  id: string;
  kind: string;
  seen?: boolean;
  communityId?: string | null;
  payload?: Record<string, unknown>;
};



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
          ...authHeaders(),
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

function getMyCommunitySlug(): string {
  try {
    return sessionStorage.getItem("fm:community:my-slug") || "";
  } catch {
    return "";
  }
}

function hasShopFromSession(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}

export default function Header() {
  // force-refresh pour le menu dynamique
  const [, setTick] = useState(0);

  useEffect(() => {
    const onShopRefresh = () => setTick((t) => t + 1);
    const onCommunityRefresh = () => setTick((t) => t + 1);
    window.addEventListener("fm:shop-refresh", onShopRefresh);
    window.addEventListener("fm:community-refresh", onCommunityRefresh);
    return () => {
      window.removeEventListener("fm:shop-refresh", onShopRefresh);
      window.removeEventListener("fm:community-refresh", onCommunityRefresh);
    };
  }, []);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [accountQuickOpen, setAccountQuickOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // ✅ compteurs communauté
  const [communityOwnerPendingCount, setCommunityOwnerPendingCount] =
    useState(0);
  const [communityMyPendingCount, setCommunityMyPendingCount] = useState(0);
  const [communityReviewUnseen, setCommunityReviewUnseen] = useState(0);
  // 👇 notifs non lues (COMMUNAUTÉ UNIQUEMENT)
  const [communityNotifCount, setCommunityNotifCount] = useState(0);

  const isMobile = useIsMobile(BREAKPOINT);

  const { status, user, signOut } = useAuth();
  const isGuest = status !== "authenticated";
  const avatarSrc = !isGuest && user?.avatarUrl ? user.avatarUrl : "";

  // 🟣 conversations → total des messages non lus
  const { items: messageThreads } = useConversations({
    enabled: status === "authenticated",
    pollMs: 5000, // ⬅️ rafraîchit toutes les 5 secondes
  });

  const unreadMessagesTotal = useMemo(
    () => messageThreads.reduce((sum, c) => sum + (c.unread || 0), 0),
    [messageThreads]
  );

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

  // Intercepter /connexion & /inscription (desktop)
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

  // 🔐 Intercepter les clics vers Mes outils pour les invités (desktop)
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (isMobile) return;
      if (status === "authenticated") return;

      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const selector = [
        'a[href^="/app/notes"]',
        'a[href^="/app/taches"]',
        'a[href^="/app/finances"]',
        'a[href^="/app/journal-trading"]',
        'a[href^="/fm-metrix"]',
        'a[href^="/podcasts"]',
      ].join(", ");

      const a = target.closest(selector) as HTMLAnchorElement | null;
      if (!a) return;

      ev.preventDefault();

      setAccountOpen(false);
      setMobileMenu(false);

      // on force le mode "signin" (auth modal)
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
      );
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [isMobile, status]);

  // ✅ modal compte “quick”
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

  // notifications → navigate to /notifications
  useEffect(() => {
    const onOpenNotifications = () => {
      navigate("/notifications");
    };
    window.addEventListener("fm:open-notifications", onOpenNotifications as EventListener);
    return () => {
      window.removeEventListener(
        "fm:open-notifications",
        onOpenNotifications as EventListener
      );
    };
  }, [navigate]);

  const hasSheetOverlay = isMobile && launcherOpen;

  // 🔴 charger compteurs demandes + avis + notifs
  useEffect(() => {
    let stopped = false;

    async function loadRequestCounts() {
      if (status !== "authenticated") {
        if (!stopped) {
          setCommunityOwnerPendingCount(0);
          setCommunityMyPendingCount(0);
        }
        return;
      }

      try {
        const res = await fetchWithFallback(
          pathVariants("/communaute/requests/counters")
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
        if (!stopped) {
          setCommunityMyPendingCount(json?.data?.myPending ?? 0);
          setCommunityOwnerPendingCount(json?.data?.ownerPending ?? 0);
        }
      } catch {
        if (!stopped) {
          setCommunityOwnerPendingCount(0);
          setCommunityMyPendingCount(0);
        }
      }
    }

    async function loadReviewCounts() {
      if (status !== "authenticated") {
        if (!stopped) {
          setCommunityReviewUnseen(0);
        }
        return;
      }
      try {
        const res = await fetchWithFallback(
          pathVariants("/communaute/reviews/counters/me")
        );
        if (!res.ok) {
          if (!stopped) setCommunityReviewUnseen(0);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { unseen?: number };
        };
        if (!stopped) {
          setCommunityReviewUnseen(json?.data?.unseen ?? 0);
        }
      } catch {
        if (!stopped) setCommunityReviewUnseen(0);
      }
    }

    // 🔔 Charger le compteur de TOUTES les notifications non lues
    async function loadNotifCounts() {
      if (status !== "authenticated") {
        if (!stopped) setCommunityNotifCount(0);
        return;
      }
      try {
        const res = await fetchWithFallback([
          "/notifications/unseen-count",
        ]);
        if (!res.ok) {
          if (!stopped) setCommunityNotifCount(0);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { count?: number };
        };
        
        const totalUnseen = json?.data?.count ?? 0;

        if (!stopped) {
          setCommunityNotifCount(totalUnseen);
        }
      } catch {
        if (!stopped) setCommunityNotifCount(0);
      }
    }

    loadRequestCounts();
    loadReviewCounts();
    loadNotifCounts();

    // events pour mettre à jour sans recharger
    const onReqSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { myPending?: number; ownerPending?: number }
        | undefined;
      if (!detail) return;
      setCommunityMyPendingCount(detail.myPending ?? 0);
      setCommunityOwnerPendingCount(detail.ownerPending ?? 0);
    };

    const onReviewSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { unseen?: number }
        | undefined;
      if (!detail) return;
      setCommunityReviewUnseen(detail.unseen ?? 0);
    };

    const onNotifSeenOne = () => {
      setCommunityNotifCount((c) => (c > 0 ? c - 1 : 0));
    };

    window.addEventListener(
      "fm:community-req-counters",
      onReqSync as EventListener
    );
    window.addEventListener(
      "fm:community-review-counters",
      onReviewSync as EventListener
    );
    window.addEventListener(
      "fm:community-notifs:seen-one",
      onNotifSeenOne as EventListener
    );

    return () => {
      stopped = true;
      window.removeEventListener(
        "fm:community-req-counters",
        onReqSync as EventListener
      );
      window.removeEventListener(
        "fm:community-review-counters",
        onReviewSync as EventListener
      );
      window.removeEventListener(
        "fm:community-notifs:seen-one",
        onNotifSeenOne as EventListener
      );
    };
  }, [status]);

  // 👉 on construit le menu centralisé (sans badges)
  const navGroups: HeaderNavGroup[] = buildHeaderNav({
    authStatus: status,
    hasShop: hasShopFromSession(),
    myCommunitySlug: getMyCommunitySlug(),
    // ❌ Plus de communityCounts - plus de badges dans les menus
  });

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
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-10 xl:px-16">
          <div className="h-16 grid grid-cols-[auto_1fr_auto] items-center">
            <LogoBrand logoSrc={logo} />
            <div className="justify-self-center">
              <DesktopNav groups={navGroups} />
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
                // 🔴 total messages non lus → badge sur icône chat
                messagesUnread={unreadMessagesTotal}
                // 🔔 total notifications non lues → badge sur icône notif
                notificationsUnread={communityNotifCount}
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
                // 👇 total communautés (demandes + avis + notifs communauté ONLY)
                communityBadgeCount={
                  (communityOwnerPendingCount || 0) +
                  (communityMyPendingCount || 0) +
                  (communityReviewUnseen || 0) +
                  (communityNotifCount || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Drawer mobile */}
        <MobileDrawer
          open={mobileMenu}
          groups={navGroups}
          onClose={() => setMobileMenu(false)}
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
