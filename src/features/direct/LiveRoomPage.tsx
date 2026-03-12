// src/pages/direct/LiveRoomPage.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

type LiveStatus = "scheduled" | "live" | "ended" | "cancelled";
type CommunityLive = { id: string; communityId: string; title: string; description: string; status: LiveStatus; startsAt: string | null; roomName: string; endedAt?: string | null; isPublic?: boolean; plannedEndAt?: string | null; isOwner?: boolean; };
type SessionShape = { token?: string; user?: any };

function authHeaders(): HeadersInit {
  const tok = (loadSession() as SessionShape | null)?.token ?? "";
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

function decodeHtmlEntities(input: string): string {
  if (typeof document === "undefined") return input;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

function sanitizeDisplayName(raw: string): string {
  if (!raw) return "";
  let s = decodeHtmlEntities(raw);
  try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
  return s.replace(/[^A-Za-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getDisplayNameFromSession(): string | null {
  const session = loadSession() as SessionShape | null;
  const u = session?.user;
  if (!u) return null;
  const names = [ u.fullName, u.displayName, u.display_name, u.name, [u.firstName, u.lastName].filter(Boolean).join(" "), [u.first_name, u.last_name].filter(Boolean).join(" ") ].filter(Boolean) as string[];
  for (const name of names) { const clean = sanitizeDisplayName(name); if (clean) return clean; }
  return null;
}

const JITSI_DOMAIN = "live.fullmargin.net";
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function LiveRoomPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { id: liveId } = useParams<{ id: string }>();

  const [live, setLive] = useState<CommunityLive | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      if (jitsiApiRef.current) jitsiApiRef.current.dispose();
    };
  }, []);

  const localDisplayName = useMemo(() => {
    const forced = search.get("name");
    return sanitizeDisplayName(forced || getDisplayNameFromSession() || "") || "Membre FullMargin";
  }, [search]);

  useEffect(() => {
    if (!liveId) return;
    let cancelled = false;
    async function fetchLive() {
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
        const json = await res.json();
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
  }, [liveId]);

  useEffect(() => {
    if (!liveId || !live || live.status !== "live") return;
    let cancelled = false;
    async function fetchToken() {
      setLoadingToken(true);
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/jitsi-token?name=${encodeURIComponent(localDisplayName)}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
        const json = await res.json();
        if (!json.ok || !json.data?.token) throw new Error(json.error);
        if (!cancelled) {
          setJwtToken(json.data.token);
          setIsModerator(!!json.data.isOwner);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Impossible de récupérer le token.");
      } finally {
        if (!cancelled) setLoadingToken(false);
      }
    }
    fetchToken();
  }, [liveId, live, localDisplayName]);

  useEffect(() => {
    if (!live || live.status !== "live" || !jwtToken || !jitsiContainerRef.current || isModerator === null) return;
    if (jitsiApiRef.current) return; 

    try {
      const baseConfig = {
        subject: live.title || "Live FullMargin", 
        prejoinPageEnabled: false, 
        prejoinConfig: { enabled: false },
        disableDeepLinking: true,  
        testing: { disableE2EE: true },
        e2ee: { enabled: false },
      };

      const roleConfig = isModerator
        ? {
            // ADMIN : On lui laisse le contrôle total
            ...baseConfig,
          }
        : {
            // MEMBRE : La prison de verre
            ...baseConfig,
            readOnlyName: true,   
            disableProfile: true,
            startWithAudioMuted: true, 
            disableInviteFunctions: true, 
            disableRemoteMute: true, 
            remoteVideoMenu: { disableKick: true, disableGrantModerator: true },
            participantsPane: { hideModeratorSettingsTab: true, hideMoreActionsButton: true, hideMuteAllButton: true },
            toolbarButtons: ["microphone", "camera", "desktop", "chat", "tileview", "fullscreen", "hangup", "raisehand"]
          };

      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: String(live.roomName).toLowerCase(),
        parentNode: jitsiContainerRef.current,
        jwt: jwtToken,
        width: "100%",
        height: "100%",
        userInfo: { displayName: localDisplayName },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false, 
            SHOW_PROMOTIONAL_CLOSE_PAGE: false, 
            SHOW_POWERED_BY: false,
            DEFAULT_LOGO_URL: TRANSPARENT_PIXEL,
            DEFAULT_WELCOME_PAGE_LOGO_URL: TRANSPARENT_PIXEL,
            DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
        },
        configOverwrite: roleConfig,
      });

      jitsiApiRef.current = api;

      api.on("readyToClose", () => {
        if (isModerator) {
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
            jitsiApiRef.current = null;
          }
          setShowEndModal(true);
        } else {
          navigate(-1);
        }
      });
    } catch (e) {
      setError("Erreur lors de l'initialisation du module vidéo.");
    }
  }, [live, jwtToken, isModerator, navigate, localDisplayName]);

  const handleEndLiveInDB = async () => {
    try {
      const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/end`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() } });
      const json = await res.json();
      if (json.ok) navigate(-1);
      else alert(json.error || "Impossible de terminer ce live.");
    } catch (e) {
      alert("Une erreur est survenue lors de la clôture du live.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      
      {showEndModal && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6"><span className="text-3xl">🛑</span></div>
            <h2 className="text-2xl font-bold text-white mb-3">Clôturer le direct ?</h2>
            <div className="flex flex-col gap-3">
              <button onClick={handleEndLiveInDB} className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold">Oui, clôturer définitivement</button>
              <button onClick={() => navigate(-1)} className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">Non, quitter simplement</button>
            </div>
          </div>
        </div>
      )}

      <div ref={jitsiContainerRef} className={`flex-1 w-full h-full transition-opacity duration-500 ${!jwtToken || error || showEndModal ? "opacity-0" : "opacity-100"}`} />

      {(!jwtToken || error) && !showEndModal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm z-[150]">
           <div className="flex flex-col items-center gap-4 text-center max-w-sm">
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse"><span className="text-2xl">🎥</span></div>
             <div>
                <h1 className="text-lg font-semibold truncate mb-1">{live?.title || "Chargement..."}</h1>
                {loadingToken || loading ? <p className="text-sm text-slate-400">Préparation de la salle...</p> : error ? (
                  <div className="mt-4">
                    <p className="text-sm border border-red-500/30 bg-red-500/10 text-red-400 py-2 px-3 rounded-xl mb-4">{error}</p>
                    <button onClick={() => navigate(-1)} className="text-sm px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-slate-200">Retour</button>
                  </div>
                ) : null}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}