// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\Sections.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";
import { MessageSquareText, Bell } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { buildMenu, type Kind } from "./menu";
import { useNavigate } from "react-router-dom";
import AccountList from "./sections/AccountList";
import SkeletonList from "./sections/SkeletonList";
import { useConversations } from "../messages/useConversations";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

type Props = {
  marketOpen: boolean;
  communityOpen: boolean;
  accountOpen: boolean;

  onCloseMarket: () => void;
  onCloseCommunity: () => void;
  onCloseAccount: () => void;

  avatarSrc: string; // compat
};

/** Filtre local des items indésirables (clé ou libellé) */
function filterMenuItems<T extends { key?: string; label?: string }>(arr: T[]) {
  return arr.filter(
    (it) =>
      !["notifications", "logout", "signout", "sign-out"].includes(
        (it.key || "").toLowerCase(),
      ) &&
      [
        "notifications",
        "se déconnecter",
        "se deconnecter",
        "déconnexion",
        "deconnexion",
      ].every((ban) => (it.label || "").toLowerCase() !== ban),
  );
}

/** Ouvre l’auth en mémorisant une destination (intention) */
function openAuthWithFrom(to?: string, mode: "signin" | "signup" = "signin") {
  try {
    const href =
      (to && to.trim()) ||
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", href);
    localStorage.setItem("fm:oauth:open", "account");
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } }),
  );
}

export default function SectionsDock({
  marketOpen,
  communityOpen,
  accountOpen,
  onCloseMarket,
  onCloseCommunity,
  onCloseAccount,
}: Props) {
  const navigate = useNavigate();

  // mémorise l’état précédent (utile si besoin d’évolution)
  const prev = useRef({ marketOpen, communityOpen, accountOpen });
  useEffect(() => {
    prev.current = { marketOpen, communityOpen, accountOpen };
  }, [marketOpen, communityOpen, accountOpen]);

  // Quel dock on veut afficher
  const desiredKind: Kind | null = useMemo(() => {
    if (marketOpen) return "market";
    if (communityOpen) return "community";
    if (accountOpen) return "account";
    return null;
  }, [marketOpen, communityOpen, accountOpen]);

  const { status, user } = useAuth();
  const isGuest = status !== "authenticated";
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);

  // 🔴 conversations → total messages non lus (uniquement si dock "account" actif)
  const { items: convItems } = useConversations({
    enabled: status === "authenticated" && desiredKind === "account",
  });
  const unreadMessages = convItems.reduce((sum, c) => sum + (c.unread || 0), 0);

  // ✅ RECUPERATION DES NOTIFS FM METRIX NON LUES
  const [fmMetrixUnreadCount, setFmMetrixUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || desiredKind !== "account") return;

    let aborted = false;
    const fetchFmCounts = async () => {
      try {
        const session = loadSession();
        const token = session?.token;
        if (!token) return;

        // On charge les dernières notifs pour compter celles de FM Metrix
        const res = await fetch(`${API_BASE}/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (!aborted && json.ok && Array.isArray(json.data?.items)) {
          const count = json.data.items.filter(
            (n: any) =>
              !n.seen &&
              (n.kind.startsWith("fmmetrix.") ||
                n.payload?.feature === "fm-metrix"),
          ).length;
          setFmMetrixUnreadCount(count);
        }
      } catch {
        // ignore errors
      }
    };

    fetchFmCounts();
    return () => {
      aborted = true;
    };
  }, [status, desiredKind]);

  // Items disponibles (sans notifications / logout)
  const hasItems = useCallback(
    (k: Kind) => {
      if (status === "loading") return true; // on considère “oui” => on affichera un skeleton
      const original = buildMenu(k, { status, roles }) as Array<{
        key?: string;
        label?: string;
      }>;
      return filterMenuItems(original).length > 0;
    },
    [status, roles],
  );

  const DURATION = 260;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const closeTimeout = useRef<number | null>(null);
  const switchTimeout = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [animIn, setAnimIn] = useState(false);

  // cleanup timeouts
  useEffect(() => {
    return () => {
      if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
      if (switchTimeout.current) window.clearTimeout(switchTimeout.current);
    };
  }, []);

  // Affichage du dock
  useEffect(() => {
    // Si on demande un dock
    if (desiredKind) {
      if (!mounted) {
        // ouvrir si pas encore monté
        setKind(desiredKind);
        setMounted(true);
        requestAnimationFrame(() => setAnimIn(true));
        return;
      }
      // déjà monté : on “switch” s’il change
      if (desiredKind !== kind) {
        setAnimIn(false);
        switchTimeout.current = window.setTimeout(() => {
          setKind(desiredKind);
          requestAnimationFrame(() => setAnimIn(true));
        }, DURATION);
      }
      return;
    }

    // Rien de demandé -> on ferme
    if (!desiredKind && mounted) {
      setAnimIn(false);
      closeTimeout.current = window.setTimeout(() => {
        setMounted(false);
        setKind(null);
      }, DURATION);
    }
  }, [desiredKind, mounted, kind]);

  if (!mounted || !kind) return null;

  const handleClose = () => {
    if (kind === "market") onCloseMarket();
    else if (kind === "community") onCloseCommunity();
    else onCloseAccount();
  };

  const goCommunity = () => {
    const target = "/communautes/dashboard?tab=feed";
    if (isGuest) {
      openAuthWithFrom(target, "signin");
      handleClose(); // on referme le dock quand on déclenche l’auth
      return;
    }
    navigate(target);
    handleClose();
  };

  const goMessages = () => {
    const target = "/discussions";
    if (isGuest) {
      openAuthWithFrom(target, "signin");
      handleClose();
      return;
    }
    // ouvre le module de messages…
    window.dispatchEvent(new Event("fm:open-messages"));
    // …et on ferme la section
    handleClose();
  };

  const goNotifications = () => {
    const target = "/notifications";
    if (isGuest) {
      openAuthWithFrom(target, "signin");
      handleClose();
      return;
    }
    navigate(target);
    handleClose();
  };

  // Affichage d’un skeleton si les items ne sont pas prêts/vides temporairement
  const showSkeleton = !hasItems(kind);

  const aside = (
    <aside
      className={[
        // 🔥 très haut et dans un portail → survole tout
        "fixed z-[10000] left-0 top-16 max-h-[calc(100dvh-4rem)]",
        // 👉 responsive: prend toute la largeur dispo, max 360px
        "w-full max-w-[360px]",
        "supports-[backdrop-filter]:bg-skin-surface/60 bg-skin-surface/95 backdrop-blur-xl backdrop-saturate-150",
        "ring-1 ring-skin-border/15 shadow-2xl rounded-r-3xl flex flex-col overflow-hidden",
        "will-change-transform will-change-opacity",
      ].join(" ")}
      style={{
        transform: animIn ? "translateX(0)" : "translateX(-100%)",
        opacity: animIn ? 1 : 0,
        transition: `transform ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}`,
      }}
      role="complementary"
      aria-label={
        kind === "market"
          ? "Dock marketplace"
          : kind === "community"
            ? "Dock communautés"
            : "Dock compte"
      }
    >
      <div className="flex-none flex justify-end px-3 py-2 border-b gap-1 border-skin-border/15 supports-[backdrop-filter]:bg-skin-surface/40">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center justify-center rounded-full p-2 text-skin-muted hover:text-skin-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
          title="Fermer"
          aria-label="Fermer"
        >
          <IoMdClose className="w-5 h-5" />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ touchAction: "pan-y" }}
      >
        {/* COMMUNITY */}
        {kind === "community" && (
          <div className="p-4">
            <p className="text-sm text-skin-muted mb-3">
              Accédez directement à votre espace Communauté.
            </p>
            <button
              type="button"
              onClick={goCommunity}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 font-medium text-white shadow
                         hover:bg-violet-500 active:scale-[.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Ouvrir le dashboard communauté
            </button>
          </div>
        )}

        {/* ACCOUNT */}
        {kind === "account" && (
          <>
            {/* 📨 / 🔔 bloc Messages + Notifications (mobile ≤ 460px) */}
            <div className="px-4 pt-4 hidden max-[460px]:block">
              <div className="flex flex-col gap-3">
                {/* Messages */}
                <button
                  type="button"
                  onClick={goMessages}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-3 ring-1 ring-skin-border/15 bg-skin-surface/80 hover:bg-skin-surface/95 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-skin-border/15 bg-[rgb(var(--tile))] relative">
                      <MessageSquareText className="w-5 h-5" />
                      {unreadMessages > 0 && (
                        <span
                          className="absolute -top-1 -right-1 inline-flex items-center justify-center
                                     min-w-[1.25rem] h-5 px-1.5 rounded-full
                                     bg-red-500 text-white text-[10px] font-semibold shadow-md"
                        >
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                    </span>
                    <span className="text-sm truncate">Messages</span>
                  </span>
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={goNotifications}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-3 ring-1 ring-skin-border/15 bg-skin-surface/80 hover:bg-skin-surface/95 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-skin-border/15 bg-[rgb(var(--tile))]">
                      <Bell className="w-5 h-5" />
                    </span>
                    <span className="text-sm truncate">Notifications</span>
                  </span>
                </button>
              </div>
            </div>

            {showSkeleton ? (
              <SkeletonList />
            ) : (
              // on masque Notifications / Logout mais on ne ferme JAMAIS automatiquement
              // ✅ On passe le compteur ici
              <AccountList
                hiddenKeys={["notifications", "logout"]}
                fmMetrixUnreadCount={fmMetrixUnreadCount}
              />
            )}
          </>
        )}

        {/* MARKET */}
        {kind === "market" && (showSkeleton ? <SkeletonList /> : null)}
      </div>
    </aside>
  );

  // 🔌 Portal vers <body> pour sortir du z-index du header
  if (typeof document === "undefined") return aside;
  return createPortal(aside, document.body);
}
