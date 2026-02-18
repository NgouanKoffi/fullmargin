// src/components/Header/sheets/QuickLauncher.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import BaseSheet from "./BaseSheet";
import {
  ChevronRight,
  Lock,
  MessageSquareText,
  Clock,
  LineChart,
} from "lucide-react";
import { buildMenu } from "../menu";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";
import { useConversations } from "../../messages/useConversations";

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

export default function QuickLauncher({
  open,
  onClose,
  hidden,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (target: "market" | "account" | "community") => void;
  hidden?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user } = useAuth();
  const isGuest = status !== "authenticated";

  const [redirectingFM, setRedirectingFM] = useState(false);
  const [fmHasActiveSub, setFmHasActiveSub] = useState(false);
  const [fmMenuOpen, setFmMenuOpen] = useState(false);

  // compteur pour les nouveaux podcasts
  const [podcastNewCount, setPodcastNewCount] = useState<number>(0);

  // 🔴 nombre total de messages non lus (privés + groupes)
  const { items: convItems } = useConversations({
    enabled: status === "authenticated" && open,
  });
  const unreadMessages = convItems.reduce((sum, c) => sum + (c.unread || 0), 0);

  const askAuth = (to?: string) => {
    openAuthWithFrom(to, "signin");
    onClose();
  };

  const goInApp = (path: string) => {
    if (isGuest) {
      askAuth(path);
      return;
    }
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const baseTools = isGuest
    ? []
    : buildMenu("account", {
        status,
        roles: user?.roles ?? [],
      });

  const tools = baseTools.filter(
    (i) => i.label !== "Notifications" && i.label !== "Se déconnecter"
  );

  // check accès FM pour badge
  useEffect(() => {
    if (!open) return;
    if (isGuest) {
      setFmHasActiveSub(false);
      return;
    }
    const session = loadSession?.();
    const token = session?.token;
    if (!token) {
      setFmHasActiveSub(false);
      return;
    }
    fetch(`${API_BASE}/payments/fm-metrix/access`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        setFmHasActiveSub(Boolean(data?.ok && data?.allowed));
      })
      .catch(() => setFmHasActiveSub(false));
  }, [open, isGuest]);

  // charge le nombre de nouveaux podcasts → SANS header custom
  useEffect(() => {
    if (!open) return;
    if (isGuest) {
      setPodcastNewCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isGuest]);

  async function handleFMMetrixAccess() {
    const session = loadSession?.();
    const token = session?.token;

    if (!token) {
      navigate("/tarifs");
      onClose();
      return;
    }

    setRedirectingFM(true);
    try {
      const resp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json().catch(() => null);

      const allowed = resp.ok && data?.ok && data.allowed;
      if (!allowed) {
        setRedirectingFM(false);
        navigate("/tarifs");
        onClose();
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
      onClose();
    } catch {
      setRedirectingFM(false);
      navigate("/tarifs");
      onClose();
    }
  }

  const isActiveLink = (href: string) => location.pathname === href;

  if (!open) return null;

  const fmGradient =
    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500";

  return (
    <BaseSheet
      open={open}
      onClose={() => {
        setFmMenuOpen(false);
        onClose();
      }}
      labelledById="quick-launcher-title"
      title="Raccourcis"
      hiddenBehind={!!hidden}
    >
      {redirectingFM && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[9999]" />
      )}

      <div className="mt-1 space-y-2">
        <h4 className="px-1 text-[11px] font-semibold trackingwide text-skin-muted uppercase">
          Navigation rapide
        </h4>

        {/* 🔵 Messages → visible UNIQUEMENT <= 405px */}
        <button
          type="button"
          onClick={() => {
            if (isGuest) {
              askAuth("/discussions");
              return;
            }
            window.dispatchEvent(new Event("fm:open-messages"));
            onClose();
          }}
          className={`hidden max-[405px]:flex w-full rounded-2xl px-3.5 py-3 ring-1 ring-skin-border/15 bg-skin-surface/80 hover:bg-skin-surface/95 transition-colors items-center justify-between gap-3 ${
            isActiveLink("/discussions") ? "bg-violet-600 text-white" : ""
          }`}
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
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      </div>

      {!isGuest && tools.length > 0 && (
        <div className="mt-6">
          <h4 className="px-1 text-[11px] font-semibold trackingwide text-skin-muted uppercase">
            Outils
          </h4>
          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 items-start">
            {tools.map((i) => {
              const hrefSafe = i.href ?? "/";
              const isFmMetrix = i.label === "FM Metrix";
              const isActive = isActiveLink(hrefSafe);
              const isPodcastItem = i.label === "Podcasts";

              if (isFmMetrix) {
                return (
                  <div
                    key="fm-metrix"
                    className="relative z-[30] min-w-[190px] md:col-span-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (redirectingFM) return;
                        setFmMenuOpen((p) => !p);
                      }}
                      disabled={redirectingFM}
                      className={`
                        group overflow-hidden
                        rounded-2xl px-4 py-3 text-sm
                        flex items-center gap-2
                        w-full
                        ${fmGradient}
                        text-white shadow-lg shadow-violet-500/35
                        transition-transform duration-150
                        hover:scale-[1.015]
                        ${redirectingFM ? "cursor-wait" : ""}
                      `}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      />

                      {!redirectingFM ? (
                        <>
                          <span className="relative z-10 inline-flex w-8 h-8 rounded-xl bg-white/15 items-center justify-center ring-1 ring-white/30">
                            <LineChart className="w-4 h-4" />
                          </span>
                          <span className="relative z-10 font-medium tracking-tight">
                            FM Metrix
                          </span>
                          <span className="relative z-10 ml-auto inline-flex items-center gap-1">
                            {!fmHasActiveSub && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 ring-1 ring-white/25 uppercase">
                                Pro
                              </span>
                            )}
                            <span
                              className={`inline-flex w-5 h-5 items-center justify-center rounded-full bg-white/10 transition-transform ${
                                fmMenuOpen ? "rotate-180" : ""
                              }`}
                            >
                              <ChevronRight className="w-3 h-3 rotate-90 text-white/90" />
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="relative z-10 flex items-center gap-3 w-full justify-center">
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
                          <span className="text-[13px] font-medium tracking-tight">
                            Connexion…
                          </span>
                        </span>
                      )}
                    </button>

                    {fmMenuOpen && !redirectingFM && (
                      <div
                        className={`
                          absolute left-0 top-[calc(100%+0.5rem)]
                          w-full rounded-2xl overflow-hidden
                          ${fmGradient}
                          shadow-xl shadow-black/25
                          backdrop-blur-sm z-[80]
                        `}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            void handleFMMetrixAccess();
                            setFmMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/10"
                        >
                          <LineChart className="w-4 h-4" />
                          <span className="truncate">
                            Accéder à Full Metrix
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigate("/fm-metrix/historique");
                            setFmMenuOpen(false);
                            onClose();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/95 hover:bg-white/10"
                        >
                          <Clock className="w-4 h-4" />
                          <span className="truncate">Historique</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (i.locked) {
                return (
                  <div
                    key={`locked-${hrefSafe}`}
                    className="rounded-2xl px-4 py-3 text-sm bg-[rgb(var(--tile))] flex items-center justify-between gap-2 cursor-not-allowed"
                    aria-disabled
                  >
                    <div className="flex items-center gap-2">
                      {i.icon}
                      <span className="whitespace-nowrap truncate">
                        {i.label}
                      </span>
                    </div>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-skin-surface/40">
                      <Lock className="w-4 h-4 text-red-600" />
                    </span>
                  </div>
                );
              }

              const base =
                i.variant === "danger"
                  ? "rounded-2xl px-4 py-3 text-sm ring-1 ring-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-300"
                  : "rounded-2xl px-4 py-3 text-sm bg-[rgb(var(--tile))] hover:bg-[rgb(var(--tile-strong))]";

              return (
                <NavLink
                  key={`in-${hrefSafe}`}
                  to={hrefSafe}
                  onClick={() => goInApp(hrefSafe)}
                  className={`${base} ${
                    isActive ? "bg-violet-600 text-white" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {i.icon}
                    <span className="whitespace-nowrap truncate flex-1">
                      {i.label}
                    </span>
                    {isPodcastItem && podcastNewCount > 0 ? (
                      <span className="inline-flex min-w-[1.6rem] justify-center px-2 py-0.5 text-[10px] rounded-full bg-gray-500 text-white">
                        {podcastNewCount}
                      </span>
                    ) : null}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </BaseSheet>
  );
}
