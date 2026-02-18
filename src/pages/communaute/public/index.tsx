// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\PublicCommunityHome.tsx

import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUrlTab } from "./hooks/useUrlTab";
import { TabCommunautes } from "./sections/Communautes";
import { ScrollTabs } from "./components/ScrollTabs";
import { TABS, type TabKey } from "./tabs.constants";
import TabFeed from "./sections/Feed";
import TabFormations from "./sections/Formations";
import { useAuth } from "../../../auth/AuthContext";
import { TabDirect } from "./sections/Direct";
import {
  getUnseenNotificationsCount,
  markNotificationsAsSeen,
} from "../private/community-details/services/notifications.service";
import TabGroupes from "./sections/Groupes";

// vérifier si l’utilisateur a une communauté + récupérer le slug
import { fetchMyCommunity } from "../private/community-details/services/community.service";

import type { TabKey as CommunityTabKey } from "../private/community-details/types";
import CommunityDesktopTabs from "../private/community-details/layout/CommunityDesktopTabs";
import MobileDrawer from "../private/community-details/layout/MobileDrawer";

import { LayoutGrid, Plus } from "lucide-react";

export default function PublicCommunityHome() {
  const { status } = useAuth();
  const navigate = useNavigate();

  const isAuthenticated = status === "authenticated";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Onglet PUBLIC contrôlé par l’URL : /communaute?tab=...
  const [tab, setTab] = useUrlTab("communautes");
  const [notifCount, setNotifCount] = useState(0);

  const [hasCommunity, setHasCommunity] = useState(false);
  const [myCommunitySlug, setMyCommunitySlug] = useState<string | null>(null);

  // 👉 sidebar visible uniquement pour les utilisateurs qui ont leur communauté
  const showSidebar = isAuthenticated && hasCommunity;

  // Charger les notifications non lues (pour le feed public)
  useEffect(() => {
    async function loadNotif() {
      try {
        const { count } = await getUnseenNotificationsCount();
        setNotifCount(count);
      } catch {
        setNotifCount(0);
      }
    }
    loadNotif();
  }, []);

  // Vérifier si l’utilisateur a une communauté + slug (propriétaire)
  useEffect(() => {
    if (!isAuthenticated) {
      setHasCommunity(false);
      setMyCommunitySlug(null);
      return;
    }

    let cancel = false;

    async function loadCommunity() {
      try {
        const data = await fetchMyCommunity();
        if (cancel) return;

        if (data && data.id) {
          setHasCommunity(true);
          setMyCommunitySlug(data.slug ?? null);
        } else {
          setHasCommunity(false);
          setMyCommunitySlug(null);
        }
      } catch {
        if (cancel) return;
        setHasCommunity(false);
        setMyCommunitySlug(null);
      }
    }

    loadCommunity();
    return () => {
      cancel = true;
    };
  }, [isAuthenticated]);

  // Quand on clique sur un tab (ScrollTabs), marquer comme lues si besoin
  const handleTabChange = async (t: TabKey) => {
    setTab(t);

    const tabsThatClearNotif: TabKey[] = [
      "feed",
      "groupes",
      "direct",
      "formations",
    ];

    if (notifCount > 0 && tabsThatClearNotif.includes(t)) {
      await markNotificationsAsSeen().catch(() => {});
      setNotifCount(0);
    }
  };

  const tabs = useMemo(
    () =>
      TABS.map((t) => ({
        ...t,
        notif: t.key === "feed" ? notifCount : 0,
      })),
    [notifCount]
  );

  const content = useMemo(() => {
    switch (tab as TabKey) {
      case "feed":
        return <TabFeed />;
      case "formations":
        return <TabFormations />;
      case "groupes":
        return <TabGroupes />;
      case "direct":
        return <TabDirect />;
      case "communautes":
      default:
        return <TabCommunautes dense={showSidebar} />;
    }
  }, [tab, showSidebar]);

  // Sidebar : raccourcis vers l’espace communauté réel
  const handleSidebarSelect = (k: CommunityTabKey) => {
    if (hasCommunity && myCommunitySlug) {
      navigate(`/communaute/${myCommunitySlug}?tab=${k}`);
    } else {
      navigate(`/communaute/mon-espace?tab=${k}`);
    }
  };

  // 🔗 "Fil d’actualité" depuis la sidebar desktop
  const handleGoToFeedFromSidebar = () => {
    setTab("feed");
  };

  // 🔗 "Fil d’actualité" depuis le drawer mobile
  const handleGoToFeedFromDrawer = () => {
    setTab("feed");
    setMobileDrawerOpen(false);
  };

  const gridClass = showSidebar
    ? sidebarCollapsed
      ? "mt-4 lg:grid lg:grid-cols-[80px,minmax(0,1fr)] lg:gap-6"
      : "mt-4 lg:grid lg:grid-cols-[260px,minmax(0,1fr)] lg:gap-8"
    : "mt-4";

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pb-10">
      {/* Onglets publics + icône menu communauté à gauche (mobile) */}
      <ScrollTabs
        tabs={tabs}
        active={tab as TabKey}
        onChange={handleTabChange}
        sideSlot={
          showSidebar ? (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="
                inline-flex h-9 w-9 items-center justify-center
                rounded-full
                bg-violet-600 text-white
                shadow-sm
                hover:bg-violet-700
                dark:bg-violet-500 dark:hover:bg-violet-600
                lg:hidden
              "
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          ) : null
        }
        rightSlot={
          isAuthenticated && !hasCommunity ? (
            <button
              type="button"
              onClick={() => navigate("/communaute/mon-espace?tab=apercu")}
              className="
        inline-flex items-center gap-2
        rounded-full px-3 sm:px-4 py-2
        text-xs sm:text-sm font-medium
        bg-violet-600 text-white
        shadow-sm
        hover:bg-violet-700
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        whitespace-nowrap
        flex-shrink-0
      "
            >
              <Plus className="w-4 h-4" />
              <span>Créer ma communauté</span>
            </button>
          ) : null
        }
      />

      {/* Grille : avec ou sans sidebar selon la connexion + propriété de communauté */}
      <div className={gridClass}>
        {showSidebar && (
          <div className="hidden lg:block">
            <CommunityDesktopTabs
              onSelect={handleSidebarSelect}
              isOwner={true}
              hasCommunity={hasCommunity}
              isSelfSpace={true}
              ownerPendingCount={0}
              myPendingCount={0}
              reviewUnseen={0}
              notificationsUnseen={notifCount}
              canSeeNotifications={true}
              showPurchasesTab={true}
              onCollapseChange={setSidebarCollapsed}
              onGoToFeed={handleGoToFeedFromSidebar}
              isFeedActive={tab === "feed"} // ✅ active quand on est sur le feed
            />
          </div>
        )}

        {/* Contenu principal PUBLIC */}
        <section className="min-w-0 mt-2 lg:mt-0">{content}</section>
      </div>

      {/* Drawer mobile communauté (slide droite -> gauche) */}
      {showSidebar && (
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          active={"apercu"}
          onSelect={handleSidebarSelect}
          isOwner={true}
          canAccessPrivates={true}
          hasCommunity={hasCommunity}
          isSelfSpace={true}
          ownerPendingCount={0}
          myPendingCount={0}
          reviewUnseen={0}
          notificationsUnseen={notifCount}
          canSeeNotifications={true}
          showPurchasesTab={true}
          onGoToFeed={handleGoToFeedFromDrawer}
          isFeedActive={tab === "feed"} // ✅ idem sur mobile
        />
      )}
    </main>
  );
}
