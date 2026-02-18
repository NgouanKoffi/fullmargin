// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\Sections.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../../auth/AuthContext";
import { buildMenu, type Kind } from "./menu";
import { useNavigate } from "react-router-dom";
import AccountList from "./sections/AccountList";
import { useIsDesktop } from "./ui/tokens";
import SkeletonList from "./sections/SkeletonList";

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
        (it.key || "").toLowerCase()
      ) &&
      [
        "notifications",
        "se déconnecter",
        "se deconnecter",
        "déconnexion",
        "deconnexion",
      ].every((ban) => (it.label || "").toLowerCase() !== ban)
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
    new CustomEvent("fm:open-account", { detail: { mode } })
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
  const isDesktop = useIsDesktop(900);
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
    [status, roles]
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

  // ⚙️ Affichage du dock
  useEffect(() => {
    if (!isDesktop) {
      // on passe en mobile => on ferme
      if (mounted) {
        setAnimIn(false);
        closeTimeout.current = window.setTimeout(() => {
          setMounted(false);
          setKind(null);
        }, DURATION);
      }
      return;
    }

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
  }, [isDesktop, desiredKind, mounted, kind, animIn]);

  if (!isDesktop || !mounted || !kind) return null;

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
    // On peut choisir de garder le dock ouvert côté desktop si tu préfères;
    // ici on ne le ferme pas pour rester cohérent avec le commentaire existant.
  };

  // Affichage d’un skeleton si les items ne sont pas prêts/vides temporairement
  const showSkeleton = !hasItems(kind);

  return (
    <aside
      className={[
        "fixed z-[61] left-0 top-16 max-h-[calc(100dvh-4rem)] w-[360px]",
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
            {showSkeleton ? (
              <SkeletonList />
            ) : (
              // on masque Notifications / Logout mais on ne ferme JAMAIS automatiquement
              <AccountList hiddenKeys={["notifications", "logout"]} />
            )}
          </>
        )}

        {/* MARKET */}
        {kind === "market" && (showSkeleton ? <SkeletonList /> : null)}
      </div>
    </aside>
  );
}
