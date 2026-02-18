// src/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthCtx, AuthState, Session, User } from "./types";
import { notifyError } from "../components/Notification";
import { API_BASE } from "../lib/api";
import { apiMe, loginRequest, registerRequest } from "./lib/authApi";
import { handleOauthErrorOnce } from "./lib/helpers";
import { loadSession, saveSession } from "./lib/storage";

import {
  getErrorMessage,
  readAndClearIntent,
  sanitizeRedirect,
  fallbackAfterAuth,
  isNo2FA,
  isNeeds2FA,
  type LoginPayloadBase,
  type LoginPayloadNeeds2FA,
  type LoginPayloadNo2FA,
  getReferral,
  SUPPRESS_KEY,
  SUPPRESS_TTL_MS,
} from "./AuthContext/helpers";

import { PRESENCE_INTERVAL_MS, postPresence } from "./AuthContext/presence";

import {
  INACTIVITY_MS,
  WINDOW_ACTIVITY_EVENTS,
  DOC_ACTIVITY_EVENTS,
} from "./AuthContext/inactivity";

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  const refreshTimer = useRef<number | null>(null);
  const inactivityTimer = useRef<number | null>(null);
  const activityBound = useRef(false);
  const activityHandlersRef = useRef<{
    onWindowActivity?: EventListener;
    onDocVisibilityChange?: EventListener;
  }>({});

  const redirectedRef = useRef(false);
  const handledErrorRef = useRef(false);

  const presenceTimer = useRef<number | null>(null);
  const presenceBound = useRef(false);
  const presenceHandlersRef = useRef<{
    onVisibility?: EventListener;
    onOnline?: EventListener;
    onOffline?: EventListener;
    onPageHide?: EventListener;
  }>({});

  const clearTimer = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleAbsoluteExpiry = (expiresAt: number) => {
    clearTimer();
    let ms = expiresAt - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) {
      if (import.meta.env?.DEV) {
        console.warn(
          "[Auth] scheduleAbsoluteExpiry: invalid diff =",
          ms,
          " -> fallback INACTIVITY_MS"
        );
      }
      ms = INACTIVITY_MS;
    }
    refreshTimer.current = window.setTimeout(() => {
      saveSession(null);
      setState({ status: "anonymous", user: null });
    }, Math.max(0, ms));
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    inactivityTimer.current = window.setTimeout(() => {
      if (import.meta.env?.DEV) {
        console.warn(
          `[Auth] Inactivité > ${
            INACTIVITY_MS / (60 * 60 * 1000)
          }h → déconnexion`
        );
      }
      saveSession(null);
      setState({ status: "anonymous", user: null });
      window.dispatchEvent(new CustomEvent("fm:open-account"));
    }, INACTIVITY_MS);
  };

  // 👉 Fix : on ne dépend plus de state ici (évitons le bug de closure)
  const bumpActivity = () => {
    resetInactivityTimer();
  };

  const bindActivityWatchers = () => {
    if (activityBound.current) return;
    const onWindowActivity: EventListener = () => bumpActivity();
    const onDocVisibilityChange: EventListener = () => {
      if (document.visibilityState === "visible") bumpActivity();
    };
    for (const t of WINDOW_ACTIVITY_EVENTS) {
      window.addEventListener(t, onWindowActivity, { passive: true });
    }
    for (const t of DOC_ACTIVITY_EVENTS) {
      document.addEventListener(t, onDocVisibilityChange, { passive: true });
    }
    activityHandlersRef.current.onWindowActivity = onWindowActivity;
    activityHandlersRef.current.onDocVisibilityChange = onDocVisibilityChange;
    activityBound.current = true;
  };

  const unbindActivityWatchers = () => {
    if (!activityBound.current) return;
    const { onWindowActivity, onDocVisibilityChange } =
      activityHandlersRef.current;
    if (onWindowActivity) {
      for (const t of WINDOW_ACTIVITY_EVENTS) {
        window.removeEventListener(t, onWindowActivity);
      }
    }
    if (onDocVisibilityChange) {
      for (const t of DOC_ACTIVITY_EVENTS) {
        document.removeEventListener(t, onDocVisibilityChange);
      }
    }
    activityHandlersRef.current = {};
    activityBound.current = false;
  };

  const mergeUserIntoSession = (partial: Partial<User>) => {
    const cur = loadSession();
    if (!cur || !cur.user) return;
    const next: Session = { ...cur, user: { ...cur.user, ...partial } };
    saveSession(next);
    setState({ status: "authenticated", user: next.user });
    resetInactivityTimer();
  };

  /* -------- Boot session -------- */
  useEffect(() => {
    const s = loadSession();
    if (!s || s.expiresAt <= Date.now()) {
      saveSession(null);
      setState({ status: "anonymous", user: null });
      return;
    }
    setState({ status: "authenticated", user: s.user });
    scheduleAbsoluteExpiry(s.expiresAt);
    bindActivityWatchers();
    resetInactivityTimer();

    apiMe(s.token).then((me) => {
      if (me) {
        setState({ status: "authenticated", user: me });
        scheduleAbsoluteExpiry(s.expiresAt);
        resetInactivityTimer();
        return;
      }

      if (me === null) {
        // ✅ seulement token invalide/expiré
        saveSession(null);
        setState({ status: "anonymous", user: null });
        if (inactivityTimer.current) {
          window.clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
        unbindActivityWatchers();
        return;
      }

      // me === undefined => erreur réseau/serveur => on garde la session
      if (import.meta.env?.DEV) {
        console.warn("[Auth] apiMe unreachable => keep session");
      }
    });

    return () => {
      clearTimer();
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      unbindActivityWatchers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleOauthErrorOnce(handledErrorRef);
  }, []);

  useEffect(() => {
    const onMerge = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<User>;
      if (detail && typeof detail === "object") mergeUserIntoSession(detail);
    };
    window.addEventListener("fm:auth-merge-user", onMerge as EventListener);
    return () =>
      window.removeEventListener(
        "fm:auth-merge-user",
        onMerge as EventListener
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Réception de session (login normal) -------- */
  useEffect(() => {
    type DetailShape = Session | { session: Session; redirectUrl?: string };
    const handler = (e: Event) => {
      const ce = e as CustomEvent<DetailShape>;
      const detail = ce.detail;
      const session: Session =
        (detail as { session?: Session }).session ?? (detail as Session);
      const redirectUrlFromServer: string | undefined = (
        detail as { redirectUrl?: string }
      ).redirectUrl;

      if (!session?.token || !session?.user) return;

      saveSession(session);
      setState({ status: "authenticated", user: session.user });
      scheduleAbsoluteExpiry(session.expiresAt);
      bindActivityWatchers();
      resetInactivityTimer();

      if (redirectedRef.current) return;
      if (window.location.pathname.startsWith("/auth/success")) return;
      redirectedRef.current = true;

      const intent = sanitizeRedirect(readAndClearIntent());
      const target =
        intent || fallbackAfterAuth(session, redirectUrlFromServer);
      window.location.href = target;
    };
    window.addEventListener("fm:auth-session", handler as EventListener);
    return () =>
      window.removeEventListener("fm:auth-session", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Présence selon état d’auth -------- */
  useEffect(() => {
    const authenticated = state.status === "authenticated";
    if (!authenticated) {
      if (presenceTimer.current) {
        window.clearInterval(presenceTimer.current);
        presenceTimer.current = null;
      }
      if (presenceBound.current) {
        const { onVisibility, onOnline, onOffline, onPageHide } =
          presenceHandlersRef.current;
        if (onVisibility)
          document.removeEventListener("visibilitychange", onVisibility);
        if (onOnline) window.removeEventListener("online", onOnline);
        if (onOffline) window.removeEventListener("offline", onOffline);
        if (onPageHide) window.removeEventListener("pagehide", onPageHide);
        presenceHandlersRef.current = {};
        presenceBound.current = false;
      }
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      unbindActivityWatchers();
      return;
    }

    postPresence("online").catch(() => {});
    if (!presenceTimer.current) {
      presenceTimer.current = window.setInterval(() => {
        postPresence("heartbeat").catch(() => {});
      }, PRESENCE_INTERVAL_MS);
    }

    if (!presenceBound.current) {
      const onVisibility: EventListener = () => {
        const hidden = document.visibilityState === "hidden";
        postPresence(hidden ? "away" : "online").catch(() => {});
        if (!hidden) bumpActivity();
      };
      const onOnline: EventListener = () => {
        postPresence("online").catch(() => {});
        bumpActivity();
      };
      const onOffline: EventListener = () => {
        postPresence("away").catch(() => {});
      };
      const onPageHide: EventListener = () => {
        postPresence("offline", true).catch(() => {});
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      window.addEventListener("pagehide", onPageHide);
      presenceHandlersRef.current.onVisibility = onVisibility;
      presenceHandlersRef.current.onOnline = onOnline;
      presenceHandlersRef.current.onOffline = onOffline;
      presenceHandlersRef.current.onPageHide = onPageHide;
      presenceBound.current = true;
    }
    bindActivityWatchers();
    resetInactivityTimer();
    return () => {
      if (presenceTimer.current) {
        window.clearInterval(presenceTimer.current);
        presenceTimer.current = null;
      }
      if (presenceBound.current) {
        const { onVisibility, onOnline, onOffline, onPageHide } =
          presenceHandlersRef.current;
        if (onVisibility)
          document.removeEventListener("visibilitychange", onVisibility);
        if (onOnline) window.removeEventListener("online", onOnline);
        if (onOffline) window.removeEventListener("offline", onOffline);
        if (onPageHide) window.removeEventListener("pagehide", onPageHide);
        presenceHandlersRef.current = {};
        presenceBound.current = false;
      }
    };
  });

  /* -------- Actions -------- */
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:oauth:from", from); // compat
      localStorage.setItem("fm:auth:intent", from);
      localStorage.setItem("fm:oauth:open", "account");

      const raw = await loginRequest(email, password);
      const payload = raw as unknown as
        | LoginPayloadBase
        | LoginPayloadNeeds2FA
        | LoginPayloadNo2FA;

      if (!payload?.ok) {
        notifyError(
          getErrorMessage(
            payload,
            "Compte introuvable ou mot de passe incorrect."
          )
        );
        return false;
      }
      if (isNo2FA(payload)) {
        window.dispatchEvent(
          new CustomEvent("fm:auth-session", {
            detail: {
              session: payload.session,
              redirectUrl: payload.redirectUrl,
            },
          })
        );
        return true;
      }
      if (isNeeds2FA(payload)) {
        window.dispatchEvent(
          new CustomEvent("fm:open-2fa", {
            detail: {
              flow: "login",
              flowId: payload.loginId ?? payload.id,
              email,
              masked: payload.masked,
              expiresInSec: payload.expiresInSec ?? 120,
            },
          })
        );
        return true;
      }
      notifyError("Réponse inattendue du serveur.");
      return false;
    } catch (e) {
      notifyError(
        getErrorMessage(
          e,
          "Connexion impossible. Vérifie ta connexion internet."
        )
      );
      return false;
    }
  };

  type RegisterRespOK = {
    ok: true;
    regId?: string;
    id?: string;
    masked?: string;
    expiresInSec?: number;
  };
  type RegisterRespKO = { ok: false; error?: string };
  type RegisterResp = RegisterRespOK | RegisterRespKO;

  const signUp = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:oauth:from", from);
      localStorage.setItem("fm:auth:intent", from);
      localStorage.setItem("fm:oauth:open", "account");

      const refCode = getReferral();
      const payload = (await registerRequest(
        fullName,
        email,
        password,
        refCode
      )) as unknown as RegisterResp;

      if (!payload?.ok) {
        notifyError(
          payload?.error || "Création impossible. Vérifie l’email et réessaie."
        );
        return false;
      }

      window.dispatchEvent(
        new CustomEvent("fm:open-2fa", {
          detail: {
            flow: "register",
            flowId: payload.regId ?? payload.id,
            email,
            masked: payload.masked,
            expiresInSec: payload.expiresInSec ?? 120,
          },
        })
      );
      return true;
    } catch (e) {
      notifyError(
        getErrorMessage(
          e,
          "Inscription impossible. Vérifie ta connexion internet."
        )
      );
      return false;
    }
  };

  const signInWithGoogle = async () => {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", from);
    localStorage.setItem("fm:auth:intent", from);
    localStorage.setItem("fm:oauth:open", "account");
    const ref = getReferral();
    const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    window.location.href = `${API_BASE}/auth/google/start${qs}`;
  };

  const signOut = async () => {
    try {
      const s = loadSession();
      if (s?.token) {
        await fetch(`${API_BASE}/presence/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${s.token}`,
          },
          body: JSON.stringify({ kind: "offline", at: Date.now() }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      if (import.meta.env?.DEV) {
        console.warn("[Auth] signOut presence notify failed:", e);
      }
    }
    sessionStorage.removeItem("fm:suppress-auth-modal-once");
    sessionStorage.setItem(SUPPRESS_KEY, String(Date.now() + SUPPRESS_TTL_MS));
    window.dispatchEvent(new CustomEvent("fm:close-account"));

    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    unbindActivityWatchers();

    saveSession(null);
    setState({ status: "anonymous", user: null });
    clearTimer();
    window.location.href = "/";
  };

  const refresh = async () => {
    const s = loadSession();
    if (!s || s.expiresAt <= Date.now()) {
      saveSession(null);
      setState({ status: "anonymous", user: null });
      return;
    }

    const me = await apiMe(s.token);

    if (me) {
      setState({ status: "authenticated", user: me });
      scheduleAbsoluteExpiry(s.expiresAt);
      resetInactivityTimer();
      return;
    }

    if (me === null) {
      // ✅ token invalide
      saveSession(null);
      setState({ status: "anonymous", user: null });
      return;
    }

    // undefined => erreur réseau => pas de logout
    if (import.meta.env?.DEV) {
      console.warn("[Auth] refresh failed => keep session");
    }
  };

  const setSession = (s: Session) => {
    saveSession(s);
    setState({ status: "authenticated", user: s.user });
    scheduleAbsoluteExpiry(s.expiresAt);
    bindActivityWatchers();
    resetInactivityTimer();
  };

  const value: AuthCtx = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === "authenticated",
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refresh,
      setSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* --------------- Hooks / composants utilitaires --------------- */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return null;

  if (status !== "authenticated") {
    const once = sessionStorage.getItem("fm:suppress-auth-modal-once") === "1";
    const until = Number(
      sessionStorage.getItem("fm:suppress-auth-modal-until") || 0
    );
    const now = Date.now();
    const suppressed = once || (until && now < until);
    if (until && now >= until)
      sessionStorage.removeItem("fm:suppress-auth-modal-until");
    if (suppressed) {
      if (once) sessionStorage.removeItem("fm:suppress-auth-modal-once");
      return null;
    }

    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }

    window.scrollTo({ top: 0 });
    window.dispatchEvent(new CustomEvent("fm:open-account"));
    return null;
  }

  return <>{children}</>;
}

export const IfAuth = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  return status === "authenticated" ? <>{children}</> : null;
};

export const IfGuest = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  return status === "anonymous" ? <>{children}</> : null;
};
