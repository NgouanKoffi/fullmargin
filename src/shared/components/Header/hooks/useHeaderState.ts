import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@core/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadSession } from "@core/auth/lib/storage";
import { useConversations } from "@features/messages/useConversations";
import { API_BASE, fetchWithFallback, pathVariants } from "../utils/api";
import { getMyCommunitySlug, hasShopFromSession } from "../utils/session";
import { BREAKPOINT } from "../constants";
import { useIsMobile } from "./useIsMobile";

export function useHeaderState() {
  const { status, user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(BREAKPOINT);

  const isGuest = status !== "authenticated";
  const avatarSrc = !isGuest && user?.avatarUrl ? user.avatarUrl : "";

  // Dynamic Navigation states
  const [, setTick] = useState(0);
  const [hasShop, setHasShop] = useState(() => hasShopFromSession());
  const [myCommunitySlug, setMyCommunitySlug] = useState(() => getMyCommunitySlug());

  // UI states
  const [mobileMenu, setMobileMenu] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [accountQuickOpen, setAccountQuickOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Counters
  const [communityOwnerPendingCount, setCommunityOwnerPendingCount] = useState(0);
  const [communityMyPendingCount, setCommunityMyPendingCount] = useState(0);
  const [communityReviewUnseen, setCommunityReviewUnseen] = useState(0);
  const [communityNotifCount, setCommunityNotifCount] = useState(0);

  const { items: messageThreads } = useConversations({
    enabled: status === "authenticated",
    pollMs: 5000,
  });

  const unreadMessagesTotal = useMemo(
    () => messageThreads.reduce((sum, c) => sum + (c.unread || 0), 0),
    [messageThreads]
  );

  // Silent verification
  useEffect(() => {
    if (status !== "authenticated") return;
    let isMounted = true;
    const token = loadSession()?.token;
    if (!token) return;

    if (!hasShop) {
      fetch(`${API_BASE}/marketplace/shops/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (isMounted && d?.ok && d?.data?.shop) {
            sessionStorage.setItem("fm:shop:exists", "1");
            setHasShop(true);
          }
        })
        .catch(() => {});
    }

    return () => { isMounted = false; };
  }, [status, hasShop]);

  useEffect(() => {
    const onShopRefresh = () => {
      setHasShop(hasShopFromSession());
      setTick((t) => t + 1);
    };
    const onCommunityRefresh = () => {
      setMyCommunitySlug(getMyCommunitySlug());
      setTick((t) => t + 1);
    };
    window.addEventListener("fm:shop-refresh", onShopRefresh);
    window.addEventListener("fm:community-refresh", onCommunityRefresh);
    return () => {
      window.removeEventListener("fm:shop-refresh", onShopRefresh);
      window.removeEventListener("fm:community-refresh", onCommunityRefresh);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync mobile menu vs resize
  useEffect(() => {
    if (!isMobile) setMobileMenu(false);
  }, [isMobile]);

  // Global Event Listeners
  useEffect(() => {
    const openS = () => setSupportOpen(true);
    const closeS = () => setSupportOpen(false);
    const openQ = () => { setMobileMenu(false); setAccountQuickOpen(true); };
    const closeQ = () => setAccountQuickOpen(false);
    const openA = () => setAccountOpen(true);
    const closeA = () => setAccountOpen(false);
    const openL = () => { setMobileMenu(false); setLauncherOpen(true); };
    const closeL = () => setLauncherOpen(false);
    const openSearch = () => setMobileMenu(false);
    const openNotif = () => navigate("/notifications");
    // Ferme le drawer mobile (émis par MobileHamburger quand on ouvre l'auth)
    const closeMobileDrawer = () => setMobileMenu(false);
    // Ferme aussi le drawer quand le modal d'auth s'ouvre
    const openAccountModal = () => setMobileMenu(false);

    window.addEventListener("fm:open-support", openS as EventListener);
    window.addEventListener("fm:close-support", closeS as EventListener);
    window.addEventListener("fm:open-account-quick", openQ as EventListener);
    window.addEventListener("fm:close-account-quick", closeQ as EventListener);
    window.addEventListener("fm:open-account-dock", openA as EventListener);
    window.addEventListener("fm:close-account-dock", closeA as EventListener);
    window.addEventListener("fm:open-launcher", openL as EventListener);
    window.addEventListener("fm:close-launcher", closeL as EventListener);
    window.addEventListener("fm:open-search", openSearch as EventListener);
    window.addEventListener("fm:open-notifications", openNotif as EventListener);
    window.addEventListener("fm:close-mobile-drawer", closeMobileDrawer as EventListener);
    window.addEventListener("fm:open-account", openAccountModal as EventListener);

    return () => {
      window.removeEventListener("fm:open-support", openS as EventListener);
      window.removeEventListener("fm:close-support", closeS as EventListener);
      window.removeEventListener("fm:open-account-quick", openQ as EventListener);
      window.removeEventListener("fm:close-account-quick", closeQ as EventListener);
      window.removeEventListener("fm:open-account-dock", openA as EventListener);
      window.removeEventListener("fm:close-account-dock", closeA as EventListener);
      window.removeEventListener("fm:open-launcher", openL as EventListener);
      window.removeEventListener("fm:close-launcher", closeL as EventListener);
      window.removeEventListener("fm:open-search", openSearch as EventListener);
      window.removeEventListener("fm:open-notifications", openNotif as EventListener);
      window.removeEventListener("fm:close-mobile-drawer", closeMobileDrawer as EventListener);
      window.removeEventListener("fm:open-account", openAccountModal as EventListener);
    };
  }, [navigate]);

  // Scroll Lock & FAB Hidden
  useEffect(() => {
    const hasSheetModal = isMobile && launcherOpen;
    document.body.style.overflow = hasSheetModal ? "hidden" : "";
    const hideFab = supportOpen || hasSheetModal || mobileMenu;
    if (hideFab) document.documentElement.setAttribute("data-hide-support", "true");
    else document.documentElement.removeAttribute("data-hide-support");
    return () => { document.body.style.overflow = ""; };
  }, [supportOpen, launcherOpen, mobileMenu, isMobile]);

  // Click interceptors
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (isMobile) return;
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const authLink = target.closest('a[href="/connexion"], a[href="/inscription"]') as HTMLAnchorElement | null;
      if (authLink) {
        ev.preventDefault();
        const mode = authLink.getAttribute("href")?.includes("inscription") ? "signup" : "signin";
        window.dispatchEvent(new CustomEvent("fm:open-account", { detail: { mode } }));
        return;
      }

      if (status !== "authenticated") {
        const selector = 'a[href^="/app/notes"], a[href^="/app/taches"], a[href^="/app/finances"], a[href^="/app/journal-trading"], a[href^="/fm-metrix"], a[href^="/podcasts"]';
        if (target.closest(selector)) {
          ev.preventDefault();
          window.dispatchEvent(new CustomEvent("fm:open-account", { detail: { mode: "signin" } }));
        }
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [isMobile, status]);

  // Counters sync
  useEffect(() => {
    let stopped = false;
    async function loadCounters() {
      if (status !== "authenticated") return;
      try {
        const [resReq, resRev, resNotif] = await Promise.all([
          fetchWithFallback(pathVariants("/communaute/requests/counters")),
          fetchWithFallback(pathVariants("/communaute/reviews/counters/me")),
          fetchWithFallback(["/notifications/unseen-count"]),
        ]);
        if (stopped) return;
        if (resReq.ok) {
          const j = await resReq.json();
          setCommunityMyPendingCount(j.data?.myPending ?? 0);
          setCommunityOwnerPendingCount(j.data?.ownerPending ?? 0);
        }
        if (resRev.ok) {
          const j = await resRev.json();
          setCommunityReviewUnseen(j.data?.unseen ?? 0);
        }
        if (resNotif.ok) {
          const j = await resNotif.json();
          setCommunityNotifCount(j.data?.count ?? 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCounters();
    const onSyncOne = () => setCommunityNotifCount((c) => Math.max(0, c - 1));
    window.addEventListener("fm:community-notifs:seen-one", onSyncOne);
    return () => {
      stopped = true;
      window.removeEventListener("fm:community-notifs:seen-one", onSyncOne);
    };
  }, [status]);

  return {
    status,
    signOut,
    isMobile,
    avatarSrc,
    hasShop,
    myCommunitySlug,
    mobileMenu,
    setMobileMenu,
    elevated,
    accountOpen,
    setAccountOpen,
    launcherOpen,
    setLauncherOpen,
    accountQuickOpen,
    setAccountQuickOpen,
    unreadMessagesTotal,
    communityNotifCount,
    communityBadgeCount:
      communityOwnerPendingCount +
      communityMyPendingCount +
      communityReviewUnseen +
      communityNotifCount,
  };
}
