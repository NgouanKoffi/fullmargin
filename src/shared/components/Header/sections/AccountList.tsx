// src/components/Header/sections/AccountList.tsx
import { useEffect, useState, useMemo } from "react";
import type React from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@core/auth/AuthContext";
import SkeletonList from "./SkeletonList";
import { tile, tileHover } from "../ui/tokens";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import {
  ChevronDown,
  LineChart,
  Clock,
  Info,
  MessageSquareText,
} from "lucide-react";
import { useConversations, type Conversation } from "@features/messages/useConversations";
import { useMenu } from "../utils/menu";

// Hook pour détecter la taille de l'écran (520px)
function useIsBelow520() {
  const [isBelow, setIsBelow] = useState(
    typeof window !== "undefined" ? window.innerWidth < 520 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 519px)");
    const onChange = (e: MediaQueryListEvent) => setIsBelow(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isBelow;
}

function openAuthWithFrom(to?: string, mode: "signin" | "signup" = "signin") {
  try {
    const href =
      to ||
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", href);
    localStorage.setItem("fm:oauth:open", "account");
  } catch {
    /* ignore */
  }

  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } }),
  );
}

type Props = {
  revealOnHover?: boolean;
  hiddenKeys?: string[];
  fmMetrixUnreadCount?: number;
  myCommunitySlug?: string;
};

type MenuItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  key?: string;
};

export default function AccountList({
  revealOnHover = false,
  hiddenKeys = ["notifications", "logout"],
  fmMetrixUnreadCount = 0,
  myCommunitySlug,
}: Props) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isGuest = status !== "authenticated";

  const location = useLocation();
  const navigate = useNavigate();

  const [redirectingFM, setRedirectingFM] = useState(false);
  const [fmAllowed, setFmAllowed] = useState(false);
  const [fmOpen, setFmOpen] = useState(false);
  const [podcastNewCount, setPodcastNewCount] = useState(0);

  const isBelow520 = useIsBelow520();
  const rawItems = useMenu("account", { status, roles, myCommunitySlug }) as MenuItem[];

  // ✅ 1. Compteur temps réel des messages
  const { items: messageThreads } = useConversations({
    enabled: !isGuest && isBelow520,
    pollMs: 5000,
  });

  const messagesUnread = useMemo(
    () => (messageThreads as Conversation[]).reduce((sum, c) => sum + (c.unread || 0), 0),
    [messageThreads],
  );

  // ✅ 2. Compteur temps réel des notifications
  const [notificationsUnread, setNotificationsUnread] = useState(0);

  useEffect(() => {
    if (isGuest || !isBelow520) return;
    let stopped = false;
    async function loadNotifCounts() {
      try {
        const token = loadSession()?.token;
        if (!token) return;
        const res = await fetch(`${API_BASE}/notifications/unseen-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!stopped) setNotificationsUnread(json?.data?.count ?? 0);
      } catch {
        /* ignore */
      }
    }
    loadNotifCounts();

    const onNotifSeenOne = () =>
      setNotificationsUnread((c) => Math.max(0, c - 1));
    window.addEventListener("fm:community-notifs:seen-one", onNotifSeenOne);

    return () => {
      stopped = true;
      window.removeEventListener(
        "fm:community-notifs:seen-one",
        onNotifSeenOne,
      );
    };
  }, [isGuest, isBelow520]);

  useEffect(() => {
    let aborted = false;
    async function fetchAccess() {
      if (isGuest) return;
      const session = loadSession?.();
      const token = session?.token;
      if (!token) return;

      try {
        const resp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => null);
        if (!aborted) setFmAllowed(Boolean(data?.ok && data?.allowed));
      } catch {
        if (!aborted) setFmAllowed(false);
      }
    }
    fetchAccess();
    return () => {
      aborted = true;
    };
  }, [status, isGuest]);

  useEffect(() => {
    let cancelled = false;
    async function loadNewPodcasts() {
      try {
        const resp = await fetch(
          `${API_BASE}/public/podcasts/__meta/new-count`,
          { cache: "no-store" },
        );
        const data = await resp.json().catch(() => null);
        if (!cancelled && data?.ok)
          setPodcastNewCount(Number(data.data?.count ?? 0));
      } catch {
        if (!cancelled) setPodcastNewCount(0);
      }
    }
    if (!isGuest) void loadNewPodcasts();
    return () => {
      cancelled = true;
    };
  }, [status, isGuest]);

  if (status === "loading")
    return <SkeletonList revealOnHover={revealOnHover} />;

  // Fonction centrale pour fermer complètement les menus
  const closeDock = () => {
    window.dispatchEvent(new CustomEvent("fm:close-account-dock"));
    window.dispatchEvent(new CustomEvent("fm:close-account-quick"));
    window.dispatchEvent(new CustomEvent("fm:close-mobile-drawer"));
  };

  const hideSet = new Set(
    hiddenKeys.map((s) => s.toLowerCase()).concat(["signout", "sign-out"]),
  );

  const items = rawItems.filter((i) => {
    const l = (i.label || "").toLowerCase();

    if (/dé?connexion|logout|sign[\s-]?out/.test(l)) return false;

    // Affiche Notifications uniquement si < 520px
    if (/^notifications?$/.test(l)) return isBelow520;

    if (hideSet.has(l)) return false;
    return true;
  });

  // ✅ Ajout dynamique de "Messages"
  if (isBelow520 && !isGuest) {
    const hasMessages = items.some((i) => i.label.toLowerCase() === "messages");
    if (!hasMessages) {
      items.push({
        label: "Messages",
        icon: <MessageSquareText className="w-5 h-5" />,
        onClick: () => {
          window.dispatchEvent(new Event("fm:open-messages"));
          closeDock(); // 🔥 Ferme instantanément la section
        },
      });
    }
  }

  const labelShow = "opacity-100 max-w-[220px] flex";
  const labelHide = [
    "hidden",
    "group-hover/dock:inline-flex group-hover/dock:opacity-100 group-hover/dock:max-w-[220px]",
    "group-focus-within/dock:inline-flex group-focus-within/dock:opacity-100 group-focus-within/dock:max-w-[220px]",
  ].join(" ");

  const baseTileDark = `${tile} dark:bg-white/10 dark:ring-white/10 dark:text-white/90`;
  const hoverTileDark = `${tileHover} dark:hover:bg-white/10`;

  const common =
    "transition-all flex items-center w-full " +
    (revealOnHover
      ? "h-10 justify-center rounded-full group-hover/dock:w-full group-hover/dock:h-auto group-hover/dock:rounded-xl group-hover/dock:px-3 group-hover/dock:py-2 group-hover/dock:justify-start group-hover/dock:gap-3"
      : "rounded-xl p-2 justify-start gap-3");

  async function goToFM() {
    const token = loadSession?.()?.token;
    if (!token) {
      openAuthWithFrom("/fm-metrix/a-propos", "signin");
      return;
    }
    setRedirectingFM(true);
    try {
      const accessResp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accessData = await accessResp.json().catch(() => null);

      if (!accessResp.ok || !accessData?.allowed) {
        setRedirectingFM(false);
        navigate("/tarifs");
        return;
      }
      const ssoResp = await fetch(`${API_BASE}/auth/sso/fullmetrix?mode=json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ssoData = await ssoResp.json().catch(() => null);

      if (ssoResp.ok && ssoData?.redirectUrl) {
        window.location.href = ssoData.redirectUrl;
        return;
      }
      setRedirectingFM(false);
      navigate("/tarifs");
    } catch {
      setRedirectingFM(false);
      navigate("/tarifs");
    }
  }

  const fmGradient =
    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500";

  return (
    <div className="px-3 pt-2 pb-1 space-y-2">
      {items.map((i) => {
        if (i.label === "FM Metrix") {
          return (
            <div key="fm-metrix" className="relative">
              <button
                type="button"
                onClick={() => !redirectingFM && setFmOpen((x) => !x)}
                disabled={redirectingFM}
                className={`relative overflow-hidden ${common} ${fmGradient} text-white shadow-md shadow-violet-500/25 ring-1 ring-white/10`}
              >
                {!redirectingFM ? (
                  <>
                    <span className="relative z-10 shrink-0 w-6 h-6 flex items-center justify-center bg-white/15 rounded-lg">
                      <LineChart className="w-4 h-4" />
                      {!fmOpen && fmMetrixUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white/20"></span>
                        </span>
                      )}
                    </span>
                    <span
                      className={`relative z-10 ${revealOnHover ? labelHide : labelShow} items-center gap-1 flex-1`}
                    >
                      Full Metrix
                    </span>
                    <span className="relative z-10 mr-1 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/25 uppercase">
                      {fmAllowed ? "Abonné" : "Pro"}
                    </span>
                    <ChevronDown
                      className={`relative z-10 w-4 h-4 transition-transform ${fmOpen ? "rotate-180" : ""}`}
                    />
                  </>
                ) : (
                  <span className="relative z-10 flex items-center gap-2 w-full justify-center">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/55 border-t-transparent animate-spin" />
                    <span className="text-[12px] font-medium tracking-tight">
                      Connexion…
                    </span>
                  </span>
                )}
              </button>
              {fmOpen && !redirectingFM && (
                <div
                  className={`mt-2 w-full rounded-2xl overflow-hidden ${fmGradient} ring-1 ring-white/15 shadow-xl backdrop-blur-sm`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/fm-metrix/a-propos");
                      setFmOpen(false);
                      closeDock();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/95 hover:bg-white/10 text-left"
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/15 items-center justify-center">
                      <Info className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-left">
                      Découvrir Full Metrix
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuest) {
                        openAuthWithFrom("/fm-metrix/a-propos");
                        setFmOpen(false);
                        return;
                      }
                      void goToFM();
                      setFmOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/95 hover:bg-white/10 text-left"
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/15 items-center justify-center">
                      <LineChart className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-left">
                      Accéder à Full Metrix
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/fm-metrix/historique");
                      setFmOpen(false);
                      closeDock();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/95 hover:bg-white/10 text-left"
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/15 items-center justify-center relative">
                      <Clock className="w-4 h-4" />
                      {fmMetrixUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white/20"></span>
                        </span>
                      )}
                    </span>
                    <span className="flex-1 text-left flex justify-between items-center">
                      Historique
                      {fmMetrixUnreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-2">
                          {fmMetrixUnreadCount}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        }

        const isInternal =
          i.href && !/^https?:\/\//i.test(i.href) && !i.href.startsWith("#");
        const isActive = isInternal && location.pathname === i.href;

        const content = (
          <>
            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
              {i.icon}
            </span>
            <span
              className={`${revealOnHover ? labelHide : labelShow} items-center gap-1 flex-1`}
            >
              {i.label}
            </span>
            {/* Badges d'alerte en temps réel */}
            {i.label === "Podcasts" && podcastNewCount > 0 && (
              <span className="ml-auto inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] rounded-full bg-gray-500 text-white shadow-sm">
                {podcastNewCount}
              </span>
            )}
            {i.label === "Messages" && messagesUnread > 0 && (
              <span className="ml-auto inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm">
                {messagesUnread > 99 ? "99+" : messagesUnread}
              </span>
            )}
            {i.label === "Notifications" && notificationsUnread > 0 && (
              <span className="ml-auto inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm">
                {notificationsUnread > 99 ? "99+" : notificationsUnread}
              </span>
            )}
          </>
        );

        if (!i.href) {
          return (
            <button
              key={`btn-${i.label}`}
              onClick={() => {
                if (i.onClick) i.onClick();
                closeDock(); // 🔥 Ferme instantanément
              }}
              className={`${baseTileDark} ${hoverTileDark} ${common}`}
            >
              {content}
            </button>
          );
        }

        if (isInternal) {
          return (
            <NavLink
              key={`in-${i.href}`}
              to={i.href}
              end={i.href === "/"}
              onClick={() => closeDock()} // 🔥 Ferme instantanément la navigation
              className={
                isActive
                  ? `${common} bg-violet-600 text-white shadow-md shadow-violet-500/25`
                  : `${baseTileDark} ${hoverTileDark} ${common}`
              }
            >
              {content}
            </NavLink>
          );
        }

        return (
          <a
            key={`ext-${i.href}`}
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseTileDark} ${hoverTileDark} ${common}`}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}
