import logo from "@assets/images/favicon.webp";
import LogoBrand from "./components/LogoBrand";
import DesktopNav from "./components/DesktopNav";
import DesktopActions from "./components/DesktopActions";
import MobileHamburger from "./components/MobileHamburger";
import MobileDrawer from "./components/MobileDrawer";
import SectionsDock from "./components/Sections";
import AccountQuickModal from "./modals/AccountQuickModal";
import MessagesMount from "@features/messages/MessagesMount";
import QuickLauncher from "./sheets/QuickLauncher";
import { buildHeaderNav } from "./navConfig";
import { useHeaderState } from "./hooks/useHeaderState";

// 👇 1. L'import correct pour React (Vite/Create React App)
import { useNavigate } from "react-router-dom";

export default function Header() {
  // 👇 2. Initialisation du hook de navigation
  const navigate = useNavigate();

  const {
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
    communityBadgeCount,
  } = useHeaderState();

  const navGroups = buildHeaderNav({
    authStatus: status,
    hasShop: hasShop,
    myCommunitySlug: myCommunitySlug || "mon-espace",
  });

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${elevated ? "shadow-header dark:shadow-headerDark" : ""}`}
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
        <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 min-[1340px]:px-8">
          <div className="h-16 flex items-center justify-between lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4 min-[1340px]:gap-8">
            <LogoBrand logoSrc={logo} />
            <div className="hidden lg:flex justify-center w-full">
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
                messagesUnread={unreadMessagesTotal}
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
                communityBadgeCount={communityBadgeCount}
              />
            </div>
          </div>
        </div>

        <MobileDrawer
          open={mobileMenu}
          groups={navGroups}
          onClose={() => setMobileMenu(false)}
        />
      </div>

      {isMobile && launcherOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70 animate-in fade-in duration-300"
            onClick={() => setLauncherOpen(false)}
          />
          <QuickLauncher
            open={launcherOpen}
            onClose={() => setLauncherOpen(false)}
            onPick={() => setLauncherOpen(false)}
          />
        </>
      )}

      <AccountQuickModal
        open={accountQuickOpen}
        onClose={() => setAccountQuickOpen(false)}
        avatarSrc={avatarSrc || logo}
        // 👇 3. On utilise navigate pour changer de page
        onGoProfile={() => navigate("/profil")}
        onSignOut={signOut}
      />

      <SectionsDock
        marketOpen={false}
        accountOpen={accountOpen}
        communityOpen={false}
        onCloseMarket={() => {}}
        onCloseAccount={() => setAccountOpen(false)}
        onCloseCommunity={() => {}}
        avatarSrc={avatarSrc || logo}
      />

      <MessagesMount />
    </header>
  );
}