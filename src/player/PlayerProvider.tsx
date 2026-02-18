// src/player/PlayerProvider.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Podcast } from "../pages/podcasts/types";
import { PlayerContext, type PlayerContextValue } from "./PlayerContext";
import { loadSession } from "../auth/lib/storage";
import { useAuth } from "../auth/AuthContext";

const STORE_CURRENT = "fm:player:current";
const STORE_QUEUE = "fm:player:queue";
const STORE_HIDDEN = "fm:player:hidden"; // "1" = fermé manuellement

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [current, setCurrent] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, _setQueue] = useState<Podcast[]>([]);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  // refs pour toujours avoir la dernière valeur dans les handlers audio
  const currentRef = useRef<Podcast | null>(null);
  const queueRef = useRef<Podcast[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setQueue = useCallback((items: Podcast[]) => {
    _setQueue(items ?? []);
  }, []);

  // ---------- Restauration au MONTAGE (si session valide) ----------
  useEffect(() => {
    const s = loadSession();
    if (!s || s.expiresAt <= Date.now()) return;

    try {
      const hidden = sessionStorage.getItem(STORE_HIDDEN) === "1";
      if (hidden) return;

      const raw = sessionStorage.getItem(STORE_CURRENT);
      if (raw) {
        const p = JSON.parse(raw) as Podcast;
        if (p && p.id) {
          setCurrent(p);
          setIsPlaying(false);
        }
      }
      const rq = sessionStorage.getItem(STORE_QUEUE);
      if (rq) {
        const arr = JSON.parse(rq) as Podcast[];
        _setQueue(Array.isArray(arr) ? arr : []);
      }
    } catch {
      /* noop */
    }
  }, []);

  // ---------- reset dur ----------
  const hardReset = useCallback(() => {
    try {
      sessionStorage.removeItem(STORE_CURRENT);
      sessionStorage.removeItem(STORE_QUEUE);
    } catch {
      /* noop */
    }

    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
        a.removeAttribute("src");
        a.load();
      } catch {
        /* noop */
      }
    }
    setIsPlaying(false);
    setPositionSec(0);
    setDurationSec(0);
    _setQueue([]);
    setCurrent(null);
  }, []);

  // écoute l’événement déclenché par signOut()
  useEffect(() => {
    const onClose = () => hardReset();
    window.addEventListener("fm:close-account", onClose as EventListener);
    return () =>
      window.removeEventListener("fm:close-account", onClose as EventListener);
  }, [hardReset]);

  // si l’état devient anonymous → reset
  useEffect(() => {
    if (status === "anonymous") hardReset();
  }, [status, hardReset]);

  // ---------- Persistance courante ----------
  useEffect(() => {
    try {
      if (current)
        sessionStorage.setItem(STORE_CURRENT, JSON.stringify(current));
      else sessionStorage.removeItem(STORE_CURRENT);
      sessionStorage.setItem(STORE_QUEUE, JSON.stringify(queue));
    } catch {
      /* noop */
    }
  }, [current, queue]);

  // ---------- Events <audio> (avec refs à jour) ----------
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const dispatchTick = () =>
      window.dispatchEvent(new CustomEvent("fm:player-timeupdate"));

    const onEnded = () => {
      const q = queueRef.current;
      const cur = currentRef.current;

      // pas de file → on stoppe
      if (!q || q.length === 0) {
        setIsPlaying(false);
        setPositionSec(0);
        return;
      }

      // pas de current → on prend le premier
      if (!cur) {
        const first = q[0];
        setCurrent(first);
        setIsPlaying(true);
        return;
      }

      // on trouve l’index du current dans la queue, puis on boucle
      const idx = q.findIndex((x) => x.id === cur.id);
      const nextIdx = idx === -1 ? 0 : (idx + 1) % q.length;
      const nxt = q[nextIdx];
      setCurrent(nxt);
      setIsPlaying(true);
    };

    const onError = () => {
      const q = queueRef.current;
      if (q && q.length > 1) {
        // même logique que ended
        const cur = currentRef.current;
        const idx = q.findIndex((x) => (cur ? x.id === cur.id : false));
        const nextIdx = idx === -1 ? 0 : (idx + 1) % q.length;
        const nxt = q[nextIdx];
        setCurrent(nxt);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };

    const onTime = () => {
      setPositionSec(a.currentTime || 0);
      dispatchTick();
    };
    const onMeta = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      setDurationSec(d);
      dispatchTick();
    };

    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);

    onMeta();
    onTime();

    return () => {
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
    };
  }, []);

  // ---------- Changement de piste ----------
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (!current?.audioUrl) {
      a.pause();
      setIsPlaying(false);
      setPositionSec(0);
      setDurationSec(0);
      return;
    }

    setPositionSec(0);
    setDurationSec(0);
    a.src = current.audioUrl;
    a.load();

    if (isPlayingRef.current) {
      a.play().catch(() => setIsPlaying(false));
    }
  }, [current]);

  // ---------- Play/Pause piloté ----------
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current?.audioUrl) return;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, current]);

  // ---------- Actions publiques ----------
  const play = useCallback((p: Podcast) => {
    try {
      sessionStorage.removeItem(STORE_HIDDEN);
    } catch {
      /* noop */
    }
    setCurrent(p);
    setIsPlaying(true);
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    const cur = currentRef.current;
    if (!q || q.length === 0) return;
    if (!cur) {
      setCurrent(q[0]);
      setIsPlaying(true);
      return;
    }
    const idx = q.findIndex((x) => x.id === cur.id);
    const nxt = q[(idx + 1) % q.length];
    setCurrent(nxt);
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    const q = queueRef.current;
    const cur = currentRef.current;
    if (!q || q.length === 0) return;
    if (!cur) {
      setCurrent(q[0]);
      setIsPlaying(true);
      return;
    }
    const idx = q.findIndex((x) => x.id === cur.id);
    const prv = q[(idx - 1 + q.length) % q.length];
    setCurrent(prv);
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => setIsPlaying((v) => !v), []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setIsPlaying(false);
    setPositionSec(0);
  }, []);

  const quit = useCallback(() => {
    try {
      sessionStorage.setItem(STORE_HIDDEN, "1");
      sessionStorage.removeItem(STORE_CURRENT);
      sessionStorage.removeItem(STORE_QUEUE);
    } catch {
      /* noop */
    }

    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setIsPlaying(false);
    setPositionSec(0);
    setDurationSec(0);
    _setQueue([]);
    setCurrent(null);
  }, []);

  const seek = useCallback(
    (sec: number) => {
      const a = audioRef.current;
      if (!a) return;
      const dur = Number.isFinite(a.duration) ? a.duration : durationSec || 0;
      const t = Math.max(0, Math.min(dur || 0, sec));
      a.currentTime = t;
      setPositionSec(t);
      window.dispatchEvent(new CustomEvent("fm:player-timeupdate"));
    },
    [durationSec]
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      isPlaying,
      queue,
      setQueue,
      play,
      toggle,
      next,
      prev,
      stop,
      quit,
      positionSec,
      durationSec,
      seek,
    }),
    [
      current,
      isPlaying,
      queue,
      setQueue,
      play,
      toggle,
      next,
      prev,
      stop,
      quit,
      positionSec,
      durationSec,
      seek,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" style={{ display: "none" }} />
      {children}
    </PlayerContext.Provider>
  );
}
