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

export default function Header() {
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
        onGoProfile={() => window.dispatchEvent(new Event("fm:open-account-quick"))}
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
