// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\MobileActions.tsx
import {
  ShoppingCart,
  Bell,
  MessageSquareText,
  Users,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

type Props = {
  // même contrat que DesktopActions pour contrôler les sheets depuis le parent
  marketOpen: boolean;
  accountOpen: boolean;
  communityOpen: boolean;

  onOpenMarket: () => void;
  onCloseMarket: () => void;

  // onOpenAccount est volontairement non-déstructuré (peut être passé par le parent, mais non utilisé ici)
  onOpenAccount: () => void;
  onCloseAccount: () => void;

  onOpenCommunity: () => void;
  onCloseCommunity: () => void;

  avatarSrc?: string;
};

export default function MobileActions(props: Props) {
  const {
    marketOpen,
    accountOpen,
    communityOpen,
    onOpenMarket,
    onCloseMarket,
    // onOpenAccount, // ❌ ne pas déstructurer pour éviter le warning "unused"
    onCloseAccount,
    onOpenCommunity,
    onCloseCommunity,
    avatarSrc,
  } = props;

  const { status } = useAuth();
  const isAuthed = status === "authenticated";
  const navigate = useNavigate();

  const openAuth = (mode: "signin" | "signup" = "signin") =>
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } })
    );

  const btn =
    "inline-flex items-center justify-center rounded-full p-2 ring-1 ring-skin-border/15 " +
    "supports-[backdrop-filter]:bg-skin-header/40 bg-skin-header/60 backdrop-blur-md text-skin-base " +
    "hover:bg-skin-header/55 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring";

  const showImg = Boolean(avatarSrc && avatarSrc.trim() !== "");

  /** 🛒 Ouvre le MarketSheet sur mobile */
  const openMarketSheet = () => {
    if (!isAuthed) return openAuth("signin");
    // ferme d'abord les autres sheets éventuelles
    if (accountOpen) onCloseAccount();
    if (communityOpen) onCloseCommunity();
    if (!marketOpen) onOpenMarket();
  };

  const goMessages = () =>
    isAuthed ? navigate("/discussions") : openAuth("signin");

  const goNotifications = () =>
    isAuthed ? navigate("/notifications") : openAuth("signin");

  const toggleCommunity = () => {
    if (!isAuthed) return openAuth("signin");
    if (communityOpen) onCloseCommunity();
    else {
      onOpenCommunity();
      if (marketOpen) onCloseMarket();
      if (accountOpen) onCloseAccount();
    }
  };

  const goProfileOrAuth = () =>
    isAuthed ? navigate("/profil") : openAuth("signin");

  return (
    <div className="flex min-[900px]:hidden items-center gap-2">
      <button
        type="button"
        onClick={goMessages}
        className={btn}
        aria-label="Messages"
        title="Messages"
      >
        <MessageSquareText className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={goNotifications}
        className={btn}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* 🛒 Marketplace → ouvre le MarketSheet */}
      <button
        type="button"
        onClick={openMarketSheet}
        className={btn}
        aria-label="Marketplace"
        title="Marketplace"
        aria-expanded={marketOpen}
      >
        <ShoppingCart className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={toggleCommunity}
        className={btn}
        aria-label={communityOpen ? "Fermer Communauté" : "Ouvrir Communauté"}
        title="Communauté"
        aria-pressed={communityOpen}
      >
        <Users className="w-5 h-5" />
      </button>

      {/* Avatar / compte */}
      <button
        type="button"
        onClick={goProfileOrAuth}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden
                   ring-1 ring-skin-border/20 supports-[backdrop-filter]:bg-skin-header/40
                   bg-skin-header/60 backdrop-blur-md transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
        aria-label="Compte"
      >
        {showImg ? (
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 opacity-80" />
          </span>
        )}
      </button>
    </div>
  );
}
