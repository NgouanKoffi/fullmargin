// src/pages/direct/LiveRoomPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiExternalAPIFactory;
  }
}

/* ---- Types Jitsi ---- */
type JitsiInitOptions = {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  userInfo?: { displayName?: string };
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  jwt?: string;
};

type JitsiEventHandler = (...args: unknown[]) => void;

type JitsiExternalAPI = {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addEventListener?: (event: string, handler: JitsiEventHandler) => void;
  removeEventListener?: (event: string, handler: JitsiEventHandler) => void;
};

type JitsiExternalAPIFactory = new (
  domain: string,
  opts: JitsiInitOptions
) => JitsiExternalAPI;

/* ---- Types Live ---- */
type LiveStatus = "scheduled" | "live" | "ended" | "cancelled";

type CommunityLive = {
  id: string;
  communityId: string;
  title: string;
  description: string;
  status: LiveStatus;
  startsAt: string | null;
  roomName: string;
  endedAt?: string | null;
  isPublic?: boolean;
  plannedEndAt?: string | null;
  isOwner?: boolean;
};

type LiveApiResponse = {
  ok: boolean;
  data?: { live?: CommunityLive };
  error?: string;
};

type JitsiTokenResp = {
  ok: boolean;
  data?: { token: string; room: string; isOwner: boolean };
  error?: string;
};

/* ---- Auth Session ---- */
type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  display_name?: string;

  // ✅ évite les (u as any)
  first_name?: string;
  last_name?: string;
};

type SessionShape = { token?: string; user?: SessionUser };

function authHeaders(): HeadersInit {
  const tok = (loadSession() as SessionShape | null)?.token ?? "";
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

/* ---- utils ---- */
function decodeHtmlEntities(input: string): string {
  if (typeof document === "undefined") return input;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

function sanitizeDisplayName(raw: string): string {
  if (!raw) return "";
  let s = decodeHtmlEntities(raw);
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    void e; // eslint(no-empty) safe
  }
  s = s
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

function getDisplayNameFromSession(): string | null {
  const session = loadSession() as SessionShape | null;
  const u = session?.user;
  if (!u) return null;

  const names = [
    u.fullName,
    u.displayName,
    u.display_name,
    u.name,
    [u.firstName, u.lastName].filter(Boolean).join(" "),
    [u.first_name, u.last_name].filter(Boolean).join(" "),
  ].filter(Boolean) as string[];

  for (const name of names) {
    const clean = sanitizeDisplayName(name);
    if (clean) return clean;
  }
  return null;
}

/* ---- Domaine Jitsi ---- */
const JITSI_DOMAIN = "live.fullmargin.net";

export default function LiveRoomPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiExternalAPI | null>(null);

  // anti double-exec
  const didEndRef = useRef(false);
  const didLeaveRef = useRef(false);

  // action UI explicite (sinon null)
  const actionRef = useRef<"leave" | "end" | null>(null);

  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { id: liveId } = useParams<{ id: string }>();

  const [live, setLive] = useState<CommunityLive | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ empêche la page d’avoir un scroll qui “coupe” Jitsi
  useEffect(() => {
    if (typeof document === "undefined") return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const localDisplayName = useMemo(() => {
    const forced = search.get("name");
    const fromUrl = forced ? sanitizeDisplayName(forced) : null;
    const fromSession = getDisplayNameFromSession();
    return (
      sanitizeDisplayName(fromUrl || fromSession || "") || "Membre FullMargin"
    );
  }, [search]);

  // reset guards si on change de live
  useEffect(() => {
    didEndRef.current = false;
    didLeaveRef.current = false;
    actionRef.current = null;
    setJwtToken(null);
    setError(null);
  }, [liveId]);

  /* ---- END LIVE (Owner only) ---- */
  const endLiveOnServer = useCallback(async () => {
    if (!liveId) return;
    try {
      await fetch(`${API_BASE}/communaute/lives/${liveId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
    } catch (e) {
      console.error("Erreur lors de la fin du live :", e);
    }
  }, [liveId]);

  const endLiveOnce = useCallback(async () => {
    if (didEndRef.current) return;
    didEndRef.current = true;
    await endLiveOnServer();
  }, [endLiveOnServer]);

  const leavePageOnce = useCallback(() => {
    if (didLeaveRef.current) return;
    didLeaveRef.current = true;
    navigate(-1);
  }, [navigate]);

  /* ---- UI actions ---- */
  const requestLeaveOnly = useCallback(() => {
    actionRef.current = "leave";
    try {
      apiRef.current?.executeCommand("hangup");
    } catch (e) {
      void e;
    }
    window.setTimeout(() => leavePageOnce(), 800);
  }, [leavePageOnce]);

  const requestEndForAll = useCallback(() => {
    actionRef.current = "end";
    try {
      apiRef.current?.executeCommand("endConference");
    } catch (e) {
      void e;
    }
    void endLiveOnce();
    window.setTimeout(() => leavePageOnce(), 1200);
  }, [endLiveOnce, leavePageOnce]);

  /* ---- Load Live ---- */
  useEffect(() => {
    if (!liveId) {
      setError("Live introuvable.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        });

        const json = (await res.json()) as LiveApiResponse;
        if (!json.ok || !json.data?.live) throw new Error(json.error);

        if (!cancelled) {
          setLive(json.data.live);
          if (json.data.live.status === "ended")
            setError("Ce live est terminé.");
          if (json.data.live.status === "cancelled")
            setError("Ce live a été annulé.");
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLive();
    return () => {
      cancelled = true;
    };
  }, [liveId]);

  /* ---- Fetch JWT token (obligatoire pour prosody auth=token) ---- */
  useEffect(() => {
    if (!liveId) return;
    if (!live || live.status !== "live") return;

    let cancelled = false;

    async function fetchToken() {
      setLoadingToken(true);
      try {
        const url = `${API_BASE}/communaute/lives/${liveId}/jitsi-token?name=${encodeURIComponent(
          localDisplayName
        )}`;

        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        });

        const json = (await res.json()) as JitsiTokenResp;
        if (!json.ok || !json.data?.token) throw new Error(json.error);

        if (!cancelled) setJwtToken(json.data.token);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Impossible de récupérer le token.");
        }
      } finally {
        if (!cancelled) setLoadingToken(false);
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [liveId, live, localDisplayName]);

  /* ---- Init Jitsi ---- */
  useEffect(() => {
    if (!live || live.status !== "live" || !containerRef.current) return;
    if (!jwtToken) return;

    const loadApi = () =>
      new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const tag = document.createElement("script");
        tag.src = `https://${JITSI_DOMAIN}/external_api.js`;
        tag.async = true;
        tag.onload = () => resolve();
        tag.onerror = () => reject(new Error("Jitsi load failed"));
        document.body.appendChild(tag);
      });

    let cancelled = false;
    let api: JitsiExternalAPI | null = null;

    const handleVideoConferenceLeft: JitsiEventHandler = () => {
      if (live.isOwner && actionRef.current === "end") void endLiveOnce();
      leavePageOnce();
    };

    const handleReadyToClose: JitsiEventHandler = () => {
      if (live.isOwner && actionRef.current === "end") void endLiveOnce();
      leavePageOnce();
    };

    loadApi()
      .then(() => {
        if (cancelled || !window.JitsiMeetExternalAPI) return;

        api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: live.roomName,
          parentNode: containerRef.current!,
          width: "100%",
          height: "100%",
          userInfo: { displayName: localDisplayName },
          jwt: jwtToken,
          configOverwrite: {
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            HIDE_DEEP_LINKING_LOGO: true,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "chat",
              "participants-pane",
              "tileview",
              "settings",
              "raisehand",
            ],
          },
        });

        apiRef.current = api;

        // ✅ Afficher le "nom de la réunion" (titre) dans l'UI Jitsi
        try {
          api.executeCommand("subject", live.title || "Live FullMargin");
        } catch (e) {
          void e;
        }

        api.addEventListener?.(
          "videoConferenceLeft",
          handleVideoConferenceLeft
        );
        api.addEventListener?.("readyToClose", handleReadyToClose);
      })
      .catch(console.error);

    return () => {
      cancelled = true;

      if (api) {
        api.removeEventListener?.(
          "videoConferenceLeft",
          handleVideoConferenceLeft
        );
        api.removeEventListener?.("readyToClose", handleReadyToClose);

        try {
          api.dispose();
        } catch (e) {
          void e;
        }
      } else if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          void e;
        }
      }

      apiRef.current = null;
    };
  }, [live, jwtToken, localDisplayName, endLiveOnce, leavePageOnce]);

  return (
    // ✅ plein écran + aucun scroll → plus de “coupé”
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      {/* header */}
      <header className="shrink-0 border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-start gap-2">
          <button
            onClick={requestLeaveOnly}
            className="mt-0.5 rounded-full w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 shrink-0"
            title="Quitter"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold truncate">
              {live?.title || "Live"}
            </h1>
            {loadingToken && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Connexion à la salle…
              </p>
            )}
            {error && (
              <p className="text-[11px] text-red-400 mt-0.5">{error}</p>
            )}
          </div>
        </div>

        {live?.status === "live" && (
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={requestLeaveOnly}
              className="text-xs px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Quitter
            </button>

            {live?.isOwner && (
              <button
                onClick={requestEndForAll}
                className="text-xs px-3 py-2 rounded-full bg-red-600 hover:bg-red-700"
              >
                Terminer pour tous
              </button>
            )}
          </div>
        )}
      </header>

      {/* zone Jitsi */}
      <main className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Chargement de la salle…
          </div>
        ) : error || !live || live.status !== "live" ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 text-center px-4">
            {error || "Ce live n’est pas disponible."}
          </div>
        ) : !jwtToken ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 text-center px-4">
            Récupération du token…
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 bg-black" />
        )}
      </main>
    </div>
  );
}
