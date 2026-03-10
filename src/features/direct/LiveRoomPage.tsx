// src/pages/direct/LiveRoomPage.tsx
import { useEffect, useMemo, useState } from "react";
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

  // évite les (u as any)
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
    
    // Polling du status pour s'assurer que si un admin termine le live côté BDD,
    // on est bien expulsé même si la commande Jitsi `endConference` échoue
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/communaute/lives/${liveId}`, {
          headers: { "Content-Type": "application/json", ...authHeaders() },
        });
        const json = await res.json();
        if (json.ok && json.data?.live) {
          if (json.data.live.status === "ended" || json.data.live.status === "cancelled") {
            setError("Le live a été terminé par l'administrateur.");
          }
        }
      } catch (e) {
        // silence
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
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

  /* ---- Jitsi Redirect / Init ---- */
  useEffect(() => {
    if (!live || live.status !== "live") return;
    if (!jwtToken) return;

    // Nettoyage impératif du nom de salle (Jitsi ne gère pas bien les espaces ou caractères spéciaux dans le nom de salle vs JWT)
    const cleanRoomName = String(live.roomName).replace(/[^a-zA-Z0-9]/g, "");

    // Redirection native vers le VPS de Jitsi au lieu du iFrame !
    const targetUrl = `https://${JITSI_DOMAIN}/${encodeURIComponent(cleanRoomName)}?jwt=${encodeURIComponent(jwtToken)}`;
    
    // On force la redirection (assign ou href passent mieux les bloqueurs de popups)
    window.location.href = targetUrl;
    
  }, [live, jwtToken]);

  const cleanRoomNameUi = live ? String(live.roomName).replace(/[^a-zA-Z0-9]/g, "") : "";
  const jitsiUrl = live && jwtToken 
    ? `https://${JITSI_DOMAIN}/${encodeURIComponent(cleanRoomNameUi)}?jwt=${encodeURIComponent(jwtToken)}` 
    : null;

  return (
    // ✅ Interface de transition/chargement avant le bond vers live.fullmargin.net
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-50 overflow-hidden">
        
       {/* Indication visuelle d'envoi vers la salle */}
       <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
         
         <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🎥</span>
         </div>

         <div>
            <h1 className="text-lg font-semibold truncate mb-1">
              {live?.title || "Redirection vers le live..."}
            </h1>
            
            {loadingToken || loading ? (
              <p className="text-sm text-slate-400">
                Préparation de votre accès sécurisé...
              </p>
            ) : error || !live || live.status !== "live" ? (
              <p className="text-sm border border-red-500/30 bg-red-500/10 text-red-400 py-2 px-3 rounded-xl mt-4">
                {error || "Ce live n’est pas ou plus disponible."}
              </p>
            ) : jwtToken ? (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-blue-400">
                  Connexion prête vers live.fullmargin.net !
                </p>
                <p className="text-[11px] text-slate-500">
                  Si la redirection automatique ne fonctionne pas, cliquez sur le bouton ci-dessous.
                </p>
                <a 
                  href={jitsiUrl as string}
                  className="inline-block mt-4 text-sm px-6 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Ouvrir la salle Jitsi
                </a>
              </div>
            ) : null}
         </div>

         {/* Bouton de secours si on est bloqué sur une erreur */}
         {(error || (live && live.status !== "live")) && (
             <button
               onClick={() => navigate(-1)}
               className="mt-6 text-sm px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-colors"
             >
               Retour
             </button>
         )}

       </div>

    </div>
  );
}
