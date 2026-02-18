// src/components/Header/MobileHamburger.tsx
import { useEffect, useState } from "react";
import { Bars, Close, User as UserIcon } from "./icons";
import { Crown } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

type Props = {
  open: boolean;
  toggle: () => void;
  avatarSrc?: string;
  onOpenAccount?: () => void; // legacy
  onOpenLauncher?: () => void;
  /** ouvre le modal centré compte */
  onOpenAccountModal?: () => void;
  /** nouveau : total des notifs communautés (demandes reçues + réponses) */
  communityBadgeCount?: number;
};

export default function MobileHamburger({
  open,
  toggle,
  avatarSrc,
  onOpenAccountModal,
  communityBadgeCount = 0,
}: Props) {
  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  // ✅ même logique que DesktopActions
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

  const emitCloseDrawer = () =>
    window.dispatchEvent(new CustomEvent("fm:close-mobile-drawer"));

  const openAuth = (mode: "signin" | "signup" = "signin") => {
    emitCloseDrawer();
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } }),
    );
  };

  const handleAvatarClick = () => {
    if (!isAuthed) return openAuth("signin");
    emitCloseDrawer();
    onOpenAccountModal?.();
  };

  const showImg = Boolean(avatarSrc && avatarSrc.trim() !== "");

  // 👇 on décide ici si on affiche le badge sur le burger
  const showCommunityBadge = communityBadgeCount > 0;

  return (
    // 🔁 Visible uniquement en dessous de 980px
    <div className="min-[1175px]:hidden ml-auto flex items-center gap-2">
      {/* Avatar → modal centré */}
      <button
        type="button"
        onClick={handleAvatarClick}
        aria-label="Profil"
        title={isAuthed ? "Mon espace" : "Se connecter"}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full
                   ring-1 ring-skin-border/20 supports-[backdrop-filter]:bg-skin-header/40
                   bg-skin-header/60 backdrop-blur-md transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                   relative overflow-visible"
      >
        {showImg ? (
          <img
            src={avatarSrc || undefined}
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <span className="grid place-items-center w-full h-full text-skin-muted rounded-full">
            <UserIcon className="w-5 h-5" />
          </span>
        )}

        {fmAllowed && (
          <span
            className="pointer-events-none absolute -top-1 -right-1 translate-x-1/4 -translate-y-1/4
                       w-5 h-5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500
                       ring-2 ring-skin-header/90 shadow-[0_0_10px_rgba(251,191,36,.55)]
                       flex items-center justify-center"
          >
            <Crown className="w-3 h-3 text-slate-900/90 drop-shadow-sm" />
          </span>
        )}
      </button>

      {/* Burger (menu principal) */}
      <button
        onClick={toggle}
        className="
    relative
    inline-flex
    items-center justify-center rounded-full p-2
    text-skin-base hover:bg-skin-surface
    focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
    transition-colors
  "
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        title={open ? "Fermer" : "Menu"}
        type="button"
      >
        {open ? <Close /> : <Bars />}

        {/* 🔴 badge notif communautés (sur le bouton du menu) */}
        {showCommunityBadge ? (
          <span
            className="absolute top-0 right-0
                 min-w-[1.25rem] h-5 px-1.5
                 rounded-full bg-red-500 text-white
                 text-[10px] font-semibold
                 flex items-center justify-center
                 shadow-md"
          >
            {communityBadgeCount > 99 ? "99+" : communityBadgeCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
