// src/pages/direct/LiveRoomPage.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

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
    void e;
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

const JITSI_DOMAIN = "live.fullmargin.net";

export default function LiveRoomPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { id: liveId } = useParams<{ id: string }>();

  const [live, setLive] = useState<CommunityLive | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
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
          if (json.data.live.status === "ended") setError("Ce live est terminé.");
          if (json.data.live.status === "cancelled") setError("Ce live a été annulé.");
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLive();
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        const json = await res.json();
        if (json.ok && json.data?.live) {
          if (json.data.live.status === "ended" || json.data.live.status === "cancelled") {
            setError("Le live a été terminé par l'administrateur.");
            if (jitsiApiRef.current) jitsiApiRef.current.dispose();
          }
        }
      } catch (e) {}
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [liveId]);

  /* ---- Fetch JWT token ---- */
  useEffect(() => {
    if (!liveId || !live || live.status !== "live") return;

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

        if (!cancelled) {
          setJwtToken(json.data.token);
          setIsModerator(!!json.data.isOwner);
        }
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

  /* ---- Init Jitsi Iframe ---- */
  useEffect(() => {
    if (!live || live.status !== "live" || !jwtToken || !jitsiContainerRef.current) return;
    if (jitsiApiRef.current) return; // already init

    const cleanRoomName = String(live.roomName).replace(/[^a-zA-Z0-9]/g, "");

    try {
      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: cleanRoomName,
        parentNode: jitsiContainerRef.current,
        jwt: jwtToken,
        width: "100%",
        height: "100%",
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
        },
        configOverwrite: {
          startWithAudioMuted: !isModerator,
          disableInviteFunctions: true,
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat", "participants-pane",
            "tileview", "fullscreen", "shareaudio", "sharedvideo", "hangup"
          ],
        },
      });

      jitsiApiRef.current = api;

      api.on("videoConferenceLeft", () => {
        navigate(-1);
      });

    } catch (e) {
      console.error("Jitsi Init Error:", e);
      setError("Erreur lors de l'initialisation du module vidéo.");
    }

  }, [live, jwtToken, isModerator, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      
      {/* Container Jitsi */}
      <div 
        ref={jitsiContainerRef} 
        className={`flex-1 w-full h-full transition-opacity duration-500 ${!jwtToken || error ? "opacity-0" : "opacity-100"}`}
      />

      {/* Overlay de chargement / erreur */}
      {(!jwtToken || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
           <div className="flex flex-col items-center gap-4 text-center max-w-sm">
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <span className="text-2xl">🎥</span>
             </div>

             <div>
                <h1 className="text-lg font-semibold truncate mb-1">
                  {live?.title || "Chargement..."}
                </h1>
                
                {loadingToken || loading ? (
                  <p className="text-sm text-slate-400">
                    Préparation de la salle sécurisée...
                  </p>
                ) : error ? (
                  <div className="mt-4">
                    <p className="text-sm border border-red-500/30 bg-red-500/10 text-red-400 py-2 px-3 rounded-xl mb-4">
                      {error}
                    </p>
                    <button
                      onClick={() => navigate(-1)}
                      className="text-sm px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-colors"
                    >
                      Retour
                    </button>
                  </div>
                ) : null}
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
