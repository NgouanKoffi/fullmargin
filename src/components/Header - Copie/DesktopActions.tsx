// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\DesktopActions.tsx
import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Bell,
  MessageSquareText,
  Menu,
  Lock,
  Crown,
} from "lucide-react";
import ThemeToggle from "../ThemeMode";
import SearchTrigger from "../search/SearchTrigger";
import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom";
import BalanceChip from "./BalanceChip";
import { useSellerBalance } from "../../pages/marketplace/lib/useSellerBalance";
import OrbitRing from "../ui/OrbitRing";
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
};

export default function DesktopActions({
  marketOpen,
  accountOpen,
  communityOpen,
  onCloseMarket,
  onOpenAccount,
  onCloseAccount,
  onCloseCommunity,
  avatarSrc,
  onOpenAccountModal,
}: Props) {
  const { status } = useAuth();
  const isAuthed = status === "authenticated";
  const { pathname } = useLocation();

  const { loading: balLoading, bal } = useSellerBalance();

  const sellerAvailable = bal?.available ?? 0;
  const communityAvailable = bal?.community ?? 0;
  const affiliationAvailable = bal?.affiliation ?? 0; // ✅ on la passe
  const sellerCurrency = (bal?.currency || "USD").toUpperCase();

  // ✅ nouveau : savoir si l'utilisateur a un abo FM Metrix actif
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
      new CustomEvent("fm:open-account", { detail: { mode } })
    );

  const goMessages = () => {
    if (!isAuthed) return openAuth("signin");
    window.dispatchEvent(new CustomEvent("fm:open-messages"));
  };

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

  const toggleAccountDock = () => {
    if (!isAuthed) return openAuth("signin");
    if (accountOpen) onCloseAccount();
    else {
      onOpenAccount();
      if (marketOpen) onCloseMarket();
      if (communityOpen) onCloseCommunity();
    }
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
  const messagesScopes = ["/discussions", "/messages"];

  const startsWithAny = (p: string, bases: string[]) =>
    bases.some((b) => p === b || p.startsWith(b + "/") || p.startsWith(b));

  const isAccountSectionActive =
    accountOpen || startsWithAny(pathname, accountScopes);
  const isMessagesActive = startsWithAny(pathname, messagesScopes);

  const btnBase =
    "inline-flex items-center justify-center rounded-full p-2 max-[404px]:p-1.5 " +
    "ring-1 ring-skin-border/15 supports-[backdrop-filter]:bg-skin-header/40 " +
    "bg-skin-header/60 backdrop-blur-md text-skin-base hover:bg-skin-header/55 " +
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring";

  const activeBtn =
    "bg-violet-600 text-white ring-violet-700 hover:bg-violet-600/95";
  const iconMain = "w-5 h-5 max-[404px]:w-4 max-[404px]:h-4";

  return (
    <div className="flex items-center gap-2 max-[404px]:gap-1.5">
      {isAuthed && (
        <div className="hidden min-[540px]:inline-flex">
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

      <div className="hidden min-[515px]:inline-flex">
        <SearchTrigger variant="icon" />
      </div>

      <div className="hidden min-[1170px]:block">
        <ThemeToggle />
      </div>

      <button
        type="button"
        onClick={goMessages}
        aria-pressed={isMessagesActive}
        className={`hidden min-[405px]:inline-flex ${btnBase}`}
        aria-label="Messages"
        title="Messages"
      >
        <MessageSquareText className={iconMain} />
      </button>

      <span
        className={`relative hidden min-[405px]:inline-flex ${btnBase} cursor-not-allowed opacity-70 pointer-events-none`}
        aria-disabled="true"
        aria-label="Notifications (bientôt)"
        title="Notifications — bientôt disponible"
      >
        <Bell className={iconMain} />
        <span
          className="absolute -top-0.5 -right-0.5 translate-x-1 -translate-y-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white ring-1 ring-black/10"
          aria-hidden="true"
        >
          <Lock className="w-3 h-3 text-red-600" />
        </span>
      </span>

      {/* avatar / compte */}
      <button
        type="button"
        onClick={handleAccountClick}
        aria-pressed={isAccountSectionActive}
        className={`hidden min-[1170px]:inline-flex items-center justify-center w-9 h-9 rounded-full relative
               ring-1 ring-skin-border/20 supports-[backdrop-filter]:bg-skin-header/40
               bg-skin-header/60 backdrop-blur-md transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
               ${isAccountSectionActive ? activeBtn : ""} 
               overflow-visible`} // 👈 important : on laisse dépasser le badge
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

      {/* bouton menu animé */}
      <button
        type="button"
        onClick={toggleAccountDock}
        className={`hidden min-[1170px]:inline-flex order-last ml-1 ${btnBase} relative`}
        aria-label={
          accountOpen ? "Fermer le menu compte" : "Ouvrir le menu compte"
        }
        title={accountOpen ? "Fermer le menu compte" : "Ouvrir le menu compte"}
      >
        <OrbitRing active={!accountOpen} size={30} />
        <Menu className="w-5 h-5 text-black/70 dark:text-white/90" />
      </button>
    </div>
  );
}
