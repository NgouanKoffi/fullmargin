// src/components/Header/sections/AccountList.tsx
import React, { useEffect, useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { buildMenu } from "../menu";
import SkeletonList from "./SkeletonList";
import { tile, tileHover } from "../ui/tokens";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";
import { ChevronDown, LineChart, Clock } from "lucide-react";

type Props = {
  revealOnHover?: boolean;
  hiddenKeys?: string[];
};

export default function AccountList({
  revealOnHover = false,
  hiddenKeys = ["notifications", "logout"],
}: Props) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const location = useLocation();
  const navigate = useNavigate();

  const [redirectingFM, setRedirectingFM] = useState(false);
  const [fmAllowed, setFmAllowed] = useState(false);
  const [fmOpen, setFmOpen] = useState(false);

  // compteur de nouveaux podcasts
  const [podcastNewCount, setPodcastNewCount] = useState<number>(0);

  // on check si l’utilisateur a un abo actif → juste pour le badge
  useEffect(() => {
    let aborted = false;

    async function fetchAccess() {
      if (status !== "authenticated") return;
      const session = loadSession?.();
      const token = session?.token;
      if (!token) return;

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
  }, [status]);

  // on charge le nombre de nouveaux podcasts → SANS header custom
  useEffect(() => {
    let cancelled = false;
    async function loadNewPodcasts() {
      try {
        const resp = await fetch(
          `${API_BASE}/public/podcasts/__meta/new-count`,
          {
            cache: "no-store",
          }
        );
        const data = await resp.json().catch(() => null);
        if (!cancelled && data?.ok) {
          setPodcastNewCount(Number(data.data?.count ?? 0));
        }
      } catch {
        if (!cancelled) setPodcastNewCount(0);
      }
    }
    if (status === "authenticated") {
      void loadNewPodcasts();
    }
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading")
    return <SkeletonList revealOnHover={revealOnHover} />;

  const rawItems = buildMenu("account", {
    status,
    roles,
  }) as Array<{
    key?: string;
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }>;

  const hideSet = new Set(
    hiddenKeys.map((s) => s.toLowerCase()).concat(["signout", "sign-out"])
  );
  const items = rawItems.filter((i) => {
    const k = (i.key || "").toLowerCase();
    const l = (i.label || "").toLowerCase();
    if ((k && hideSet.has(k)) || hideSet.has(l)) return false;
    if (/^notifications?$/.test(l)) return false;
    if (/dé?connexion|logout|sign[\s-]?out/.test(l)) return false;
    return true;
  });

  const labelShow = "opacity-100 max-w-[220px] flex";
  const labelHide = [
    "hidden",
    "group-hover/dock:inline-flex group-hover/dock:opacity-100 group-hover/dock:max-w-[220px]",
    "group-focus-within/dock:inline-flex group-focus-within/dock:opacity-100 group-focus-within/dock:max-w-[220px]",
  ].join(" ");

  const baseTileDark = `${tile} dark:bg-white/[0.06] dark:ring-white/10 dark:text-white/90`;
  const hoverTileDark = `${tileHover} dark:hover:bg-white/10`;

  const common =
    "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring flex items-center w-full " +
    (revealOnHover
      ? [
          "h-10 justify-center rounded-full",
          "group-hover/dock:w-full group-hover/dock:h-auto group-hover/dock:rounded-xl group-hover/dock:px-3 group-hover/dock:py-2 group-hover/dock:justify-start group-hover/dock:gap-3",
          "group-focus-within/dock:w-full group-focus-within/dock:h-auto group-focus-within/dock:rounded-xl group-focus-within/dock:px-3 group-focus-within/dock:py-2 group-focus-within/dock:justify-start group-focus-within/dock:gap-3",
        ].join(" ")
      : "rounded-xl p-2 justify-start gap-3");

  // clic sur "Accéder à FM Metrix" (dropdown)
  async function goToFM() {
    const session = loadSession?.();
    const token = session?.token;

    if (!token) {
      navigate("/tarifs");
      return;
    }

    setRedirectingFM(true);
    try {
      const accessResp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accessData = await accessResp.json().catch(() => null);

      const isOk = accessResp.ok && accessData?.ok;
      const allowed = Boolean(accessData?.allowed);

      if (!isOk || !allowed) {
        setRedirectingFM(false);
        navigate("/tarifs");
        return;
      }

      const ssoResp = await fetch(`${API_BASE}/auth/sso/fullmetrix?mode=json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const ssoData = await ssoResp.json().catch(() => null);

      if (ssoResp.ok && ssoData?.ok && ssoData.redirectUrl) {
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
        const isFmMetrix = i.label === "FM Metrix";
        const isInternal =
          i.href && !/^https?:\/\//i.test(i.href) && !i.href.startsWith("#");
        const isActive = isInternal && location.pathname === i.href;

        if (isFmMetrix) {
          return (
            <div key="fm-metrix" className="relative">
              <button
                type="button"
                onClick={() => {
                  if (redirectingFM) return;
                  setFmOpen((x) => !x);
                }}
                disabled={redirectingFM}
                className={`
                  relative overflow-hidden
                  ${common}
                  ${fmGradient}
                  text-white shadow-md shadow-violet-500/25
                  ring-1 ring-white/10
                  ${redirectingFM ? "cursor-wait" : "hover:brightness-[1.03]"}
                `}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-white/10 blur-xl opacity-70"
                />

                {!redirectingFM ? (
                  <>
                    <span className="relative z-10 shrink-0 w-6 h-6 flex items-center justify-center bg-white/15 rounded-lg">
                      <LineChart className="w-4 h-4" />
                    </span>
                    <span
                      className={`relative z-10 ${
                        revealOnHover ? labelHide : labelShow
                      } items-center gap-1 flex-1`}
                    >
                      FM Metrix
                    </span>
                    <span className="relative z-10 mr-1 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/25 uppercase">
                      {fmAllowed ? "Abonné" : "Pro"}
                    </span>
                    <ChevronDown
                      className={`relative z-10 w-4 h-4 transition-transform ${
                        fmOpen ? "rotate-180" : ""
                      }`}
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
                  className={`
                    absolute left-0 top-[calc(100%+0.25rem)]
                    w-full rounded-2xl overflow-hidden
                    ${fmGradient}
                    ring-1 ring-white/15 shadow-xl shadow-violet-500/20
                    backdrop-blur-sm z-[50]
                  `}
                >
                  <button
                    type="button"
                    onClick={() => {
                      void goToFM();
                      setFmOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/95 hover:bg-white/10 transition-colors"
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/15 items-center justify-center">
                      <LineChart className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-left">
                      Accéder à FM Metrix
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/fm-metrix/historique");
                      setFmOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/95 hover:bg-white/10 transition-colors"
                  >
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/15 items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-left">Historique</span>
                  </button>
                </div>
              )}
            </div>
          );
        }

        const isPodcastItem = i.label === "Podcasts";

        const content = (
          <>
            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
              {i.icon}
            </span>
            <span
              className={`${
                revealOnHover ? labelHide : labelShow
              } items-center gap-1 flex-1`}
            >
              {i.label}
            </span>
            {isPodcastItem && podcastNewCount > 0 ? (
              <span className="ml-auto inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] rounded-full bg-gray-500 text-white">
                {podcastNewCount}
              </span>
            ) : null}
          </>
        );

        if (!i.href) {
          return (
            <button
              key={`btn-${i.label}`}
              type="button"
              onClick={i.onClick}
              className={`${baseTileDark} ${hoverTileDark} ${common} text-left`}
            >
              {content}
            </button>
          );
        }

        const isInternalLink =
          i.href && !/^https?:\/\//i.test(i.href) && !i.href.startsWith("#");

        if (isInternalLink) {
          const cls = isActive
            ? `${common} bg-violet-600 text-white shadow-md shadow-violet-500/25`
            : `${baseTileDark} ${hoverTileDark} ${common}`;

          return (
            <NavLink
              key={`in-${i.href}`}
              to={i.href}
              end={i.href === "/"}
              className={cls}
            >
              {content}
            </NavLink>
          );
        }

        if (i.href && i.href.startsWith("#")) {
          return (
            <button
              key={`hash-${i.href}`}
              type="button"
              className={`${baseTileDark} ${hoverTileDark} ${common}`}
            >
              {content}
            </button>
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
