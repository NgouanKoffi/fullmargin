// src/features/direct/LiveRoomPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

// NOUVEAUX IMPORTS LIVEKIT
import "@livekit/components-styles";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer
} from "@livekit/components-react";

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

import { Participant } from "livekit-client";
import { toast, Toaster } from "sonner";
import { Search, Mic, MicOff, MonitorUp, MonitorOff, UserX, Share2 } from "lucide-react";
import { useParticipants, useLocalParticipant } from "@livekit/components-react";

function ParticipantRow({ p, liveId, localParticipant }: { p: Participant, liveId: string, localParticipant: Participant }) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const update = () => forceRender(n => n + 1);
    p.on("participantMetadataChanged", update);
    return () => { p.off("participantMetadataChanged", update); };
  }, [p]);
  
  let canMic = true;
  let canScreen = false;
  try {
    const metaStr = p.metadata || "{}";
    const meta = JSON.parse(metaStr);
    if (typeof meta.mic === "boolean") canMic = meta.mic;
    if (typeof meta.screen === "boolean") canScreen = meta.screen;
  } catch(e) {}

  const handlePermissionToggle = async (type: "mic" | "screen") => {
    const canPublishMic = type === "mic" ? !canMic : canMic;
    const canPublishScreen = type === "screen" ? !canScreen : canScreen;

    const actionText = type === "mic" 
      ? (canPublishMic ? "Microphone autorisé" : "Microphone bloqué") 
      : (canPublishScreen ? "Partage d'écran autorisé" : "Partage d'écran bloqué");

    const loadingToast = toast.loading("Application...");
    try {
      const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/livekit-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "toggle_permission", identity: p.identity, canPublishMic, canPublishScreen })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(actionText, { id: loadingToast });
    } catch (e: any) {
      toast.error(e.message || "Erreur réseau", { id: loadingToast });
    }
  };

  const handleKick = () => {
    toast("Expulser ce participant ?", {
      action: {
        label: "Oui, expulser",
        onClick: async () => {
          const loadingToast = toast.loading("Expulsion en cours...");
          try {
            const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/livekit-actions`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify({ action: "kick", identity: p.identity })
            });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error);
            toast.success("Participant expulsé.", { id: loadingToast });
          } catch (e: any) {
            toast.error(e.message || "Erreur réseau", { id: loadingToast });
          }
        }
      },
      cancel: { label: "Annuler", onClick: () => {} }
    });
  };

  const isMe = p.identity === localParticipant.identity;

  return (
    <div className="flex flex-col gap-2 p-3 mb-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate pr-2 text-slate-200">
          {p.name || p.identity} {isMe && <span className="text-slate-500 text-xs ml-1">(Moi)</span>}
        </span>
      </div>
      {!isMe && (
        <div className="flex items-center gap-2 mt-1">
          <button 
            onClick={() => handlePermissionToggle("mic")}
            title={canMic ? "Bloquer le micro" : "Autoriser le micro"}
            className={`flex-1 py-1.5 flex items-center justify-center rounded-lg border transition-all ${
              canMic 
              ? 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700' 
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            {canMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => handlePermissionToggle("screen")}
            title={canScreen ? "Bloquer l'écran" : "Autoriser l'écran"}
            className={`flex-1 py-1.5 flex items-center justify-center rounded-lg border transition-all ${
              canScreen 
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30' 
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {canScreen ? <MonitorUp className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={handleKick}
            title="Expulser de la salle"
            className="flex-[0.5] py-1.5 flex items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-500/20 hover:bg-red-600/30 transition-all"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AdminParticipantsPanel({ liveId }: { liveId: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[100] px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg border border-slate-700/50 backdrop-blur-sm transition-all flex items-center gap-2"
      >
        <span>👥</span>
        <span className="hidden sm:inline">Gérer les participants</span>
        <span>({participants.length})</span>
      </button>
    );
  }

  const filtered = participants.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.identity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay mobile */}
      <div 
        className="fixed inset-0 bg-black/60 z-[190] sm:hidden transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="fixed inset-x-0 bottom-0 top-auto z-[200] w-full max-h-[85vh] flex flex-col bg-slate-900/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-indigo-500/20 rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom sm:absolute sm:top-20 sm:bottom-auto sm:right-6 sm:inset-x-auto sm:w-80 sm:max-h-[80vh] sm:rounded-2xl sm:border sm:shadow-2xl sm:animate-none drop-shadow-2xl">
        <div className="flex sm:hidden w-full justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsOpen(false)}>
          <div className="w-12 h-1.5 bg-slate-700/50 rounded-full" />
        </div>
        
        <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3 bg-slate-900/80">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-base text-white">Participants ({participants.length})</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Lien copié dans le presse-papier !");
                }} 
                title="Copier le lien du live"
                className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-md hover:bg-indigo-500/10 transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">Partager</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors hidden sm:block">✕</button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-sm text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Aucun participant trouvé.</div>
          ) : (
            filtered.map((p: Participant) => (
              <ParticipantRow key={p.identity} p={p} liveId={liveId} localParticipant={localParticipant} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function LiveKitStyleOverrides() {
  const { localParticipant } = useLocalParticipant();
  const [, forceRender] = useState(0);

  useEffect(() => {
    const update = () => forceRender(n => n + 1);
    localParticipant.on("participantMetadataChanged", update);
    return () => { localParticipant.off("participantMetadataChanged", update); };
  }, [localParticipant]);
  
  let canPublishMic = true;
  let canPublishScreen = false;
  try {
    const metaStr = localParticipant.metadata || "{}";
    const meta = JSON.parse(metaStr);
    if (typeof meta.mic === "boolean") canPublishMic = meta.mic;
    if (typeof meta.screen === "boolean") canPublishScreen = meta.screen;
  } catch(e) {}

  return (
    <style>{`
      ${!canPublishMic ? '.lk-control-bar button[data-lk-source="microphone"], button:has(svg.lucide-mic) { display: none !important; pointer-events: none !important; }' : ''}
      ${!canPublishScreen ? '.lk-control-bar button[data-lk-source="screen_share"], button:has(svg.lucide-monitor-up) { display: none !important; pointer-events: none !important; }' : ''}

      /* 🔴 AJOUT : CORRECTION DU RESPONSIVE DE LA BARRE DU BAS 🔴 */
      .lk-control-bar {
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 8px !important;
        padding: 10px !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
      .lk-button-group {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 4px !important;
      }
      
      /* Ajustements pour les petits écrans (mobiles) */
      @media (max-width: 640px) {
        .lk-button {
          padding: 8px 12px !important;
        }
        .lk-button svg {
          width: 20px !important;
          height: 20px !important;
        }
        /* Masque les labels de texte sur mobile pour libérer de l'espace */
        .lk-button .lk-button-text {
          display: none !important;
        }
      }
    `}</style>
  );
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "https://live.fullmargin.net";

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
      <Toaster theme="dark" position="bottom-right" richColors />
      
      {/* BOUTON ADMIN SUPERPOSÉ */}
      {isModerator && !showEndModal && jwtToken && !error && (
        <button
          onClick={() => setShowEndModal(true)}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[100] px-3 py-2 sm:px-5 sm:py-2.5 bg-red-600/90 hover:bg-red-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-lg shadow-red-900/50 backdrop-blur-sm transition-all flex items-center gap-1.5 sm:gap-2 border border-red-500/50"
        >
          <span className="text-sm sm:text-lg">🛑</span> 
          <span className="hidden sm:inline">Terminer</span>
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
            onDisconnected={() => {
              navigate(-1);
            }}
          >
            {/* L'interface avec barre latérale native */}
            <VideoConference /> 
            <RoomAudioRenderer />
            <LiveKitStyleOverrides />
            {isModerator && liveId && <AdminParticipantsPanel liveId={liveId} />}
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