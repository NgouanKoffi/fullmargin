// src/components/FloatingSideButton.tsx
import { useEffect, useState, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useConversations } from "./messages/useConversations"; // Assure-toi du chemin
import { API_BASE } from "../lib/api";
import { loadSession } from "../auth/lib/storage";

export default function FloatingSideButton() {
  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  // 1. Récupération des Messages non lus
  const { items: convItems } = useConversations({
    enabled: isAuthed,
    pollMs: 30000,
  });
  const unreadMsgCount = convItems.reduce((sum, c) => sum + (c.unread || 0), 0);

  // 2. Récupération des Notifs FM Metrix non lues
  const [fmUnreadCount, setFmUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      setFmUnreadCount(0);
      return;
    }

    const fetchFm = async () => {
      try {
        const session = loadSession();
        const token = session?.token;
        if (!token) return;

        const res = await fetch(`${API_BASE}/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (json.ok && Array.isArray(json.data?.items)) {
          const count = json.data.items.filter(
            (n: any) =>
              !n.seen &&
              (n.kind.startsWith("fmmetrix.") ||
                n.payload?.feature === "fm-metrix"),
          ).length;
          setFmUnreadCount(count);
        }
      } catch {
        // ignore
      }
    };

    fetchFm();
    const interval = setInterval(fetchFm, 60000);
    return () => clearInterval(interval);
  }, [isAuthed]);

  // État local pour masquer le badge TEMPORAIREMENT après un clic
  const [badgeDismissed, setBadgeDismissed] = useState(false);

  // On reset le "dismiss" si le nombre TOTAL de notifs augmente (nouvelle notif arrivée)
  const prevTotalRef = useRef(0);
  const currentTotal = unreadMsgCount + fmUnreadCount;

  useEffect(() => {
    if (currentTotal > prevTotalRef.current) {
      // S'il y en a PLUS qu'avant, on réaffiche le badge
      setBadgeDismissed(false);
    }
    prevTotalRef.current = currentTotal;
  }, [currentTotal]);

  // Est-ce qu'on a du nouveau ET qu'on ne l'a pas ignoré ?
  const hasActivity = currentTotal > 0 && !badgeDismissed;

  const handleClick = () => {
    if (typeof window === "undefined") return;

    if (!isAuthed) {
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
      );
      return;
    }

    // ✅ On masque le badge au clic (feedback immédiat)
    setBadgeDismissed(true);
    window.dispatchEvent(new Event("fm:open-account-dock"));
  };

  return (
    <>
      <style>
        {`
        @keyframes fmSideHalo {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.9); }
          60% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        @keyframes fmSideIconWiggle {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(1.5px); }
          40% { transform: translateX(-1.5px); }
          60% { transform: translateX(1.5px); }
          80% { transform: translateX(-1.5px); }
        }
        .fm-side-pulse { animation: fmSideHalo 1.3s ease-out infinite; }
        .fm-side-icon-wiggle { animation: fmSideIconWiggle 1.3s ease-out infinite; }
        .fm-side-btn:hover .fm-side-pulse,
        .fm-side-btn:hover .fm-side-icon-wiggle { animation-play-state: paused; }
      `}
      </style>

      <button
        type="button"
        onClick={handleClick}
        className="
          fm-side-btn fixed top-[30%] left-0 -translate-x-1/2 z-40
          h-12 w-12 rounded-full bg-skin-surface ring-1 ring-skin-border/40
          flex items-center justify-center transition hover:scale-105
        "
        aria-label={isAuthed ? "Ouvrir le panneau" : "Se connecter"}
      >
        <div
          className="
            fm-side-pulse flex items-center justify-center h-10 w-10 rounded-full
            bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500
            shadow-[0_0_10px_rgba(139,92,246,0.7)] relative
          "
        >
          <SlidersHorizontal className="fm-side-icon-wiggle h-5 w-5 text-white" />

          {/* 🔥 INDICATEUR DE NOTIFICATION */}
          {hasActivity && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900 items-center justify-center">
                <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
              </span>
            </span>
          )}
        </div>
      </button>
    </>
  );
}
