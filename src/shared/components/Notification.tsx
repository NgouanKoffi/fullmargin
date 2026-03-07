import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiExclamationCircle,
  HiInformationCircle,
  HiXMark,
} from "react-icons/hi2";

type Kind = "success" | "warning" | "error" | "info";

export type ToastPayload = {
  kind?: Kind;
  title?: string;
  message?: string;
  duration?: number; // ms (si 0 ou négatif → pas d’auto-close)
  sticky?: boolean; // si true → pas d’auto-close
};

type Toast = Required<Omit<ToastPayload, "duration" | "sticky">> & {
  id: string;
  duration: number; // ms
  sticky: boolean;
};

const EVT = "fm:toast";

/* ===================== Helpers d’envoi ===================== */
/* eslint-disable-next-line react-refresh/only-export-components */
export function notify(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: payload }));
}
/* eslint-disable-next-line react-refresh/only-export-components */
export const notifySuccess = (m: string, t = "Succès") =>
  notify({ kind: "success", title: t, message: m });
/* eslint-disable-next-line react-refresh/only-export-components */
export const notifyError = (m: string, t = "Oups") =>
  notify({ kind: "error", title: t, message: m });
/* eslint-disable-next-line react-refresh/only-export-components */
export const notifyWarning = (m: string, t = "Attention") =>
  notify({ kind: "warning", title: t, message: m });
/* eslint-disable-next-line react-refresh/only-export-components */
export const notifyInfo = (m: string, t = "Info") =>
  notify({ kind: "info", title: t, message: m });

/* ===================== Config durée/“stickiness” ===================== */
/** Erreurs collantes par défaut (pas d’auto-close) */
const STICKY_BY_DEFAULT: Partial<Record<Kind, boolean>> = {
  error: true,
};

/** Durées de base quand aucune durée n’est fournie et que ce n’est pas collant */
const BASE_DURATION: Record<Kind, number> = {
  success: 8000,
  info: 12000,
  warning: 20000,
  error: 0, // si pas d’override → collant par défaut pour error
};

/** Durée adaptative: ms ajoutées par caractère (si non-collant et pas d’override) */
const PER_CHAR_MS = 40;
/** Plafond max pour la durée adaptative */
const MAX_DURATION = 60000;

/* ===================== UI helpers ===================== */
function iconFor(kind: Kind) {
  const base = "w-5 h-5";
  switch (kind) {
    case "success":
      return <HiCheckCircle className={`${base} text-emerald-500`} />;
    case "warning":
      return <HiExclamationTriangle className={`${base} text-amber-500`} />;
    case "error":
      return <HiExclamationCircle className={`${base} text-red-500`} />;
    default:
      return <HiInformationCircle className={`${base} text-sky-500`} />;
  }
}
function ringFor(kind: Kind) {
  switch (kind) {
    case "success":
      return "ring-emerald-500/25";
    case "warning":
      return "ring-amber-500/25";
    case "error":
      return "ring-red-500/25";
    default:
      return "ring-sky-500/25";
  }
}
function accentFor(kind: Kind) {
  switch (kind) {
    case "success":
      return "bg-emerald-500/12";
    case "warning":
      return "bg-amber-500/12";
    case "error":
      return "bg-red-500/12";
    default:
      return "bg-sky-500/12";
  }
}

/** Hôte des notifications – place-le une seule fois (ex: dans App.tsx) */
export default function NotificationHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // timers: gestion pause/reprise au survol
  const timersRef = useRef<
    Map<
      string,
      { timeoutId: number | null; remaining: number; startedAt: number }
    >
  >(new Map());

  const removeToast = useCallback((id: string) => {
    // clear timer
    const t = timersRef.current.get(id);
    if (t?.timeoutId) window.clearTimeout(t.timeoutId);
    timersRef.current.delete(id);
    // remove state
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const startTimer = useCallback(
    (toast: Toast) => {
      if (toast.sticky || toast.duration <= 0) return; // pas d’auto-close
      const entry = {
        timeoutId: null as number | null,
        remaining: toast.duration,
        startedAt: Date.now(),
      };
      entry.timeoutId = window.setTimeout(
        () => removeToast(toast.id),
        entry.remaining
      );
      timersRef.current.set(toast.id, entry);
    },
    [removeToast]
  );

  const pauseTimer = useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry?.timeoutId) return;
    const elapsed = Date.now() - entry.startedAt;
    entry.remaining = Math.max(0, entry.remaining - elapsed);
    window.clearTimeout(entry.timeoutId);
    entry.timeoutId = null;
  }, []);

  const resumeTimer = useCallback(
    (id: string) => {
      const entry = timersRef.current.get(id);
      if (!entry || entry.timeoutId || entry.remaining <= 0) return;
      entry.startedAt = Date.now();
      entry.timeoutId = window.setTimeout(
        () => removeToast(id),
        entry.remaining
      );
    },
    [removeToast]
  );

  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent<ToastPayload>).detail || {};
      const kind: Kind = d.kind ?? "info";
      const hasDurationOverride = typeof d.duration === "number";

      // Si une durée explicite est fournie ET > 0 → pas collant,
      // sinon on prend sticky par défaut pour certains types (ex: error).
      const sticky =
        d.sticky ?? (!hasDurationOverride && !!STICKY_BY_DEFAULT[kind]);

      // Calcule la durée finale
      let duration: number;
      if (hasDurationOverride) {
        duration = d.duration as number; // peut être 0 => collant
      } else if (sticky) {
        duration = 0; // collant => 0 (pas d’auto-close)
      } else {
        const base = BASE_DURATION[kind];
        const msgLen = d.message?.length ?? 0;
        const adapt =
          msgLen > 0 ? Math.min(MAX_DURATION, msgLen * PER_CHAR_MS) : 0;
        duration = Math.min(MAX_DURATION, base + adapt);
      }

      const toast: Toast = {
        id: Math.random().toString(36).slice(2),
        kind,
        title: d.title ?? "",
        message: d.message ?? "",
        sticky,
        duration,
      };

      setToasts((prev) => [...prev, toast]);
      // (re)lance le timer si applicable
      setTimeout(() => startTimer(toast), 0);
    };

    window.addEventListener(EVT, onToast as EventListener);
    return () => window.removeEventListener(EVT, onToast as EventListener);
  }, [startTimer]);

  // Portail pour être sûr de passer au-dessus de tout (z-[999])
  const node = (
    <div className="pointer-events-none fixed top-3 right-3 sm:top-5 sm:right-5 z-[999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto w-[min(92vw,520px)]
            rounded-2xl px-3 py-2.5
            shadow-2xl ring-1 ${ringFor(t.kind)}
            supports-[backdrop-filter]:bg-skin-surface/80 bg-skin-surface/95 backdrop-blur-xl
            flex items-start gap-3
          `}
          onMouseEnter={() => pauseTimer(t.id)}
          onMouseLeave={() => resumeTimer(t.id)}
        >
          <div
            className={`shrink-0 ${accentFor(
              t.kind
            )} rounded-xl w-9 h-9 grid place-items-center`}
          >
            {iconFor(t.kind)}
          </div>

          <div className="min-w-0 flex-1">
            {t.title && (
              <div className="text-sm font-semibold text-skin-base">
                {t.title}
              </div>
            )}
            {t.message && (
              <div
                className="
                  mt-0.5 text-xs text-skin-muted
                  whitespace-pre-wrap break-words
                  max-h-60 overflow-auto pr-1.5
                "
              >
                {t.message}
              </div>
            )}
          </div>

          <div className="flex items-start gap-1 ml-1">
            {/* Bouton copier (utile pour longues erreurs) */}
            {t.message && (
              <button
                aria-label="Copier le message"
                className="rounded-full px-2 py-1 text-[10px] font-semibold text-skin-muted hover:text-skin-base hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  try {
                    void navigator.clipboard.writeText(t.message);
                  } catch (e) {
                    if (import.meta.env?.DEV)
                      console.warn("[toast] clipboard write failed:", e);
                  }
                }}
              >
                Copier
              </button>
            )}
            <button
              aria-label="Fermer la notification"
              className="rounded-full p-1.5 text-skin-muted hover:text-skin-base hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => removeToast(t.id)}
            >
              <HiXMark className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Si pas de DOM (SSR), on évite le portal
  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
