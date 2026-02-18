// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\DesktopActions.tsx
import { useEffect, useState } from "react";
import { User as UserIcon, Crown, MessageSquareText, Bell } from "lucide-react";
import ThemeToggle from "../ThemeMode";
import SearchTrigger from "../search/SearchTrigger";
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom";
import BalanceChip from "./BalanceChip";
import { useSellerBalance } from "../../pages/marketplace/lib/useSellerBalance";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

type Props = {
  marketOpen: boolean;
  accountOpen: boolean;
  communityOpen: boolean;

  onOpenMarket: () => void;
  onCloseMarket: () => void;

  onOpenAccount: () => void;
  onCloseAccount: () => void;

  onOpenCommunity: () => void;
  onCloseCommunity: () => void;

  avatarSrc: string;
  onOpenAccountModal?: () => void;

  /** total des messages non lus (pour le badge chat) */
  messagesUnread?: number;

  /** total des notifications non lues (pour le badge notif) */
  notificationsUnread?: number;
};

export default function DesktopActions(props: Props) {
  const {
    accountOpen,
    avatarSrc,
    onOpenAccountModal,
    messagesUnread = 0,
    notificationsUnread = 0,
  } = props;

  const { status } = useAuth();
  const isAuthed = status === "authenticated";
  const { pathname } = useLocation();

  const { loading: balLoading, bal } = useSellerBalance();

  const sellerAvailable = bal?.available ?? 0;
  const communityAvailable = bal?.community ?? 0;
  const affiliationAvailable = bal?.affiliation ?? 0;
  const sellerCurrency = (bal?.currency || "USD").toUpperCase();

  // ✅ savoir si l'utilisateur a un abo FM Metrix actif
  const [fmAllowed, setFmAllowed] = useState(false);

  useEffect(() => {
    let aborted = false;

    async function fetchAccess() {
      if (!isAuthed) {
        if (!aborted) setFmAllowed(false);
        return;
      }
      const session = loadSession?.();
      const token = session?.token;
      if (!token) {
        if (!aborted) setFmAllowed(false);
        return;
      }

      try {
        const resp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await resp.json().catch(() => null);
        if (!aborted) {
          setFmAllowed(Boolean(data?.ok && data?.allowed));
        }
      } catch {
        if (!aborted) setFmAllowed(false);
      }
    }

    fetchAccess();
    return () => {
      aborted = true;
    };
  }, [isAuthed]);

  const openAuth = (mode: "signin" | "signup" = "signin") =>
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } }),
    );

  const handleAccountClick = () => {
    if (!isAuthed) return openAuth("signin");
    let handled = false;
    try {
      if (typeof onOpenAccountModal === "function") {
        onOpenAccountModal();
        handled = true;
      }
    } catch {
      // noop
    }
    if (!handled) {
      window.dispatchEvent(new Event("fm:open-account-quick"));
    }
  };

  const goMessages = () => {
    if (!isAuthed) return openAuth("signin");
    window.dispatchEvent(new Event("fm:open-messages"));
  };

  const goNotifications = () => {
    if (!isAuthed) return openAuth("signin");
    window.dispatchEvent(new Event("fm:open-notifications"));
  };

  const showImg = Boolean(avatarSrc && avatarSrc.trim() !== "");

  const accountScopes = [
    "/account",
    "/profil",
    "/profile",
    "/settings",
    "/security",
    "/billing",
  ];

  const startsWithAny = (p: string, bases: string[]) =>
    bases.some((b) => p === b || p.startsWith(b + "/") || p.startsWith(b));

  const isAccountSectionActive =
    accountOpen || startsWithAny(pathname, accountScopes);

  const activeBtn =
    "bg-violet-600 text-white ring-violet-700 hover:bg-violet-600/95";

  const btnBase =
    "inline-flex items-center justify-center rounded-full p-2 max-[404px]:p-1.5 " +
    "ring-1 ring-skin-border/15 supports-[backdrop-filter]:bg-skin-header/40 " +
    "bg-skin-header/60 backdrop-blur-md text-skin-base hover:bg-skin-header/55 " +
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring";

  const iconMain = "w-5 h-5 max-[404px]:w-4 max-[404px]:h-4";

  const showMsgBadge = messagesUnread > 0;
  const showNotifBadge = notificationsUnread > 0;

  return (
    <div className="flex items-center gap-2 max-[404px]:gap-1.5">
      {isAuthed && (
        <div className="inline-flex max-[370px]:hidden min-[1175px]:inline-flex">
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

      <div className="hidden min-[370px]:inline-flex">
        <SearchTrigger variant="icon" />
      </div>

      <div className="hidden min-[1000px]:block">
        <ThemeToggle />
      </div>

      {/* 💬 Messages (desktop) */}
      <button
        type="button"
        onClick={goMessages}
        className={`hidden min-[460px]:inline-flex ${btnBase} relative`}
        aria-label={
          showMsgBadge ? `Messages — ${messagesUnread} non lus` : "Messages"
        }
        title="Messages"
      >
        <MessageSquareText className={iconMain} />
        {showMsgBadge && (
          <span
            className="absolute -top-0.5 -right-0.5 translate-x-1 -translate-y-1
                       inline-flex items-center justify-center
                       min-w-[1.25rem] h-5 px-1.5
                       rounded-full bg-red-500 text-white
                       text-[10px] font-semibold shadow-md"
          >
            {messagesUnread > 99 ? "99+" : messagesUnread}
          </span>
        )}
      </button>

      {/* 🔔 Notifications (desktop) */}
      <button
        type="button"
        onClick={goNotifications}
        className={`hidden min-[520px]:inline-flex ${btnBase} relative`}
        aria-label={
          showNotifBadge ? `Notifications — ${notificationsUnread} non lues` : "Notifications"
        }
        title="Notifications"
      >
        <Bell className={iconMain} />
        {showNotifBadge && (
          <span
            className="absolute -top-0.5 -right-0.5 translate-x-1 -translate-y-1
                       inline-flex items-center justify-center
                       min-w-[1.25rem] h-5 px-1.5
                       rounded-full bg-red-500 text-white
                       text-[10px] font-semibold shadow-md"
          >
            {notificationsUnread > 99 ? "99+" : notificationsUnread}
          </span>
        )}
      </button>

      {/* avatar / compte */}
      <button
        type="button"
        onClick={handleAccountClick}
        aria-pressed={isAccountSectionActive}
        className={`hidden min-[1175px]:inline-flex items-center justify-center w-9 h-9 rounded-full relative
               ring-1 ring-skin-border/20 supports-[backdrop-filter]:bg-skin-header/40
               bg-skin-header/60 backdrop-blur-md transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
               ${isAccountSectionActive ? activeBtn : ""} 
               overflow-visible`}
        aria-label={isAuthed ? "Mon espace" : "Se connecter"}
        title={isAuthed ? "Mon espace" : "Se connecter"}
      >
        {showImg ? (
          <img
            src={avatarSrc || undefined}
            alt="avatar"
            className="w-full h-full object-cover pointer-events-none rounded-full"
            draggable={false}
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center pointer-events-none rounded-full">
            <UserIcon className="w-5 h-5 opacity-80" />
          </span>
        )}

        {fmAllowed && (
          <span
            className="
              pointer-events-none
              absolute
              -top-1
              -right-1
              translate-x-1/4
              -translate-y-1/4
              w-5 h-5
              rounded-full
              bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500
              ring-2 ring-skin-header/90
              shadow-[0_0_10px_rgba(251,191,36,.55)]
              flex items-center justify-center
            "
          >
            <Crown className="w-3 h-3 text-slate-900/90 drop-shadow-sm" />
          </span>
        )}
      </button>
    </div>
  );
}
