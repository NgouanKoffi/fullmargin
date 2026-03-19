// src/features/direct/LiveRoomPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

// NOUVEAUX IMPORTS LIVEKIT (Nettoyés)
import "@livekit/components-styles";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer 
} from "@livekit/components-react"; // ControlBar supprimé ici car inutilisé

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

const LIVEKIT_URL = "https://live.fullmargin.net";

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
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
          if (json.data.live.status === "ended" || json.data.live.status === "cancelled") {
            setError(json.data.live.status === "ended" ? "Le live a été terminé par l'administrateur." : "Ce live a été annulé.");
          }
        }
      } catch (e) {
        if (!cancelled && !live) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLive();
    const intervalId = setInterval(fetchLive, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId); 
    };
  }, [liveId]);

  useEffect(() => {
    if (!liveId || !live || live.status !== "live") return;
    let cancelled = false;
    async function fetchToken() {
      setLoadingToken(true);
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/livekit-token?name=${encodeURIComponent(localDisplayName)}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
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

  const handleEndLiveInDB = async () => {
    try {
      const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/end`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() } });
      const json = await res.json();
      if (json.ok) {
        navigate(-1);
      } else {
        alert(json.error || "Impossible de terminer ce live.");
      }
    } catch (e) {
      alert("Une erreur est survenue lors de la clôture du live.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      
      {/* BOUTON ADMIN SUPERPOSÉ */}
      {isModerator && !showEndModal && jwtToken && !error && (
        <button
          onClick={() => setShowEndModal(true)}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[100] px-3 py-2 sm:px-5 sm:py-2.5 bg-red-600/90 hover:bg-red-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-lg shadow-red-900/50 backdrop-blur-sm transition-all flex items-center gap-1.5 sm:gap-2 border border-red-500/50"
        >
          <span className="text-sm sm:text-lg">🛑</span> 
          <span className="hidden sm:inline">Clôturer le direct</span>
          <span className="inline sm:hidden">Clôturer</span>
        </button>
      )}

      {showEndModal && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6"><span className="text-3xl">🛑</span></div>
            <h2 className="text-2xl font-bold text-white mb-3">Clôturer</h2>
            <div className="flex flex-col gap-3">
              <button onClick={handleEndLiveInDB} className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20">Oui, clôturer définitivement</button>
              <button onClick={() => setShowEndModal(false)} className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">Non, annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 w-full h-full transition-opacity duration-500 ${!jwtToken || error || showEndModal ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        {jwtToken && (
          <LiveKitRoom
            video={true}
            audio={true}
            token={jwtToken}
            serverUrl={LIVEKIT_URL}
            connect={true}
            data-lk-theme="default"
            style={{ height: '100vh', width: '100vw' }}
            onDisconnected={() => navigate(-1)}
          >
            {/* L'interface avec barre latérale native */}
            <VideoConference /> 
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>

      {(!jwtToken || error) && !showEndModal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm z-[150]">
           <div className="flex flex-col items-center gap-4 text-center max-w-sm">
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse"><span className="text-2xl">🎥</span></div>
             <div>
                <h1 className="text-lg font-semibold truncate mb-1">{live?.title || "Chargement..."}</h1>
                {loadingToken || loading ? <p className="text-sm text-slate-400">Connexion au serveur vidéo...</p> : error ? (
                  <div className="mt-4">
                    <p className="text-sm border border-red-500/30 bg-red-500/10 text-red-400 py-2 px-3 rounded-xl mb-4">{error}</p>
                    <button onClick={() => navigate(-1)} className="text-sm px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-colors">Retour</button>
                  </div>
                ) : null}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}