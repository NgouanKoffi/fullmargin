// src/auth/ui/modals/TwoFactor/TwoFactorModal.tsx
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import {
  notifySuccess,
  notifyError,
} from "../../../../components/Notification";

/* ------------ Types ------------ */
type OpenDetail = {
  flow: "login" | "register";
  flowId: string;
  masked?: string;
  email?: string;
  expiresInSec?: number;
};

type Session = {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    roles: string[];
  };
  expiresAt: number;
};

type VerifyResponse = { ok: boolean; session?: Session; error?: string };
type ResendResponse = { ok: boolean; expiresInSec?: number; error?: string };

/* ------------ API helpers (ALWAYS use same base in prod) ------------ */
// In prod: VITE_API_BASE = "https://api.fullmargin.net/api"
// In dev:  VITE_API_BASE = "/api" (via Vite proxy)
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const trimmed = path.replace(/^\/+/, "");
  const withoutApi = trimmed.startsWith("api/") ? trimmed.slice(4) : trimmed;
  return joinUrl(API_BASE, withoutApi);
}

function hasErrorMessage(
  x: unknown
): x is { error?: string; message?: string } {
  return (
    typeof x === "object" && x !== null && ("error" in x || "message" in x)
  );
}

async function postJSON<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // cookies cross-origin en prod
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const peek = await res.text().catch(() => "");
    throw new Error(
      `Réponse non-JSON (${ct})${
        peek ? ` — aperçu: ${peek.slice(0, 160)}` : ""
      }`
    );
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = hasErrorMessage(data)
      ? data.error || data.message || res.statusText
      : res.statusText;
    throw new Error(`[${res.status}] ${msg}`);
  }

  return data as T;
}

/* ------------ Component ------------ */
export default function TwoFactorModal() {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<"login" | "register">("login");
  const [flowId, setFlowId] = useState<string>("");
  const [emailMasked, setEmailMasked] = useState<string>("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const timerRef = useRef<number | null>(null);

  const maskEmail = (m: string) => {
    const i = m.indexOf("@");
    if (i <= 2) return m.replace(/.(?=.*@)/g, "*");
    return (
      m.slice(0, 1) + m.slice(1, i - 1).replace(/./g, "*") + m.slice(i - 1)
    );
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as OpenDetail;
      setFlow(d.flow);
      setFlowId(d.flowId);
      setEmailMasked(d.masked || (d.email ? maskEmail(d.email) : ""));
      setCode("");

      const duration = d.expiresInSec ?? 120;
      setSecondsLeft(duration);
      setOpen(true);

      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    };

    const onClose = () => {
      setOpen(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    window.addEventListener("fm:open-2fa", onOpen as EventListener);
    window.addEventListener("fm:close-2fa", onClose as EventListener);
    return () => {
      window.removeEventListener("fm:open-2fa", onOpen as EventListener);
      window.removeEventListener("fm:close-2fa", onClose as EventListener);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  if (!open) return null;

  const mmss = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // NOTE: pas de /api ici ; buildApiUrl s’en charge
  const basePath = `auth/${flow}`;

  const onVerify = async () => {
    if (!code || code.length < 6 || !flowId) return;
    try {
      setVerifying(true);

      const cleanedCode = code.trim().replace(/\D/g, "").slice(0, 6);
      const payload =
        flow === "login"
          ? { loginId: flowId, code: cleanedCode }
          : { regId: flowId, code: cleanedCode };

      const data = await postJSON<VerifyResponse>(
        `${basePath}/verify`,
        payload
      );

      if (!data?.ok || !data.session) {
        notifyError(data?.error || "Code invalide");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("fm:auth-session", { detail: data.session })
      );
      notifySuccess(
        flow === "login" ? "Connexion réussie" : "Compte créé — bienvenue !"
      );
      setOpen(false);
      window.dispatchEvent(new CustomEvent("fm:close-2fa"));
    } catch (e) {
      notifyError(
        e instanceof Error ? e.message : "Vérification impossible. Réessaie."
      );
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (!flowId || resending) return;
    try {
      setResending(true);
      const payload =
        flow === "login" ? { loginId: flowId } : { regId: flowId };
      const data = await postJSON<ResendResponse>(
        `${basePath}/resend`,
        payload
      );

      if (!data?.ok) {
        notifyError(data?.error || "Renvoi impossible");
        return;
      }

      setSecondsLeft(data.expiresInSec ?? 120);
      setCode(""); // nouveau code -> on efface l’ancien
      notifySuccess("Nouveau code envoyé");
    } catch (e) {
      notifyError(
        e instanceof Error
          ? e.message
          : "Renvoi impossible. Vérifie ta connexion."
      );
    } finally {
      setResending(false);
    }
  };

  const title =
    flow === "login"
      ? "Vérification en 2 étapes"
      : "Confirme ton adresse email";

  return (
    <div className="fixed inset-0 z-[95]">
      <div
        className="absolute inset-0 backdrop-blur-[18px]"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-skin-surface text-skin-base ring-1 ring-skin-border/20 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border/15">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-skin-muted hover:text-skin-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
            >
              <IoMdClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-skin-muted">
              Un code a été envoyé à{" "}
              <span className="font-medium">{emailMasked}</span>. Saisis-le
              ci-dessous.
            </p>

            <label className="block text-sm font-medium mb-1">
              Code à 6 chiffres
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted font-semibold select-none">
                #
              </span>
              <input
                value={code}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                    .trim();
                  setCode(cleaned);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••••"
                className="w-full rounded-xl pl-8 pr-3 py-2
                  ring-1 ring-skin-border/30 focus:ring-2 focus:ring-fm-primary outline-none
                  bg-white/90 dark:bg-white/10 transition-all tracking-[0.4em] text-center"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-skin-muted -mt-1">
              <span>Expire dans {mmss()}</span>
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="text-fm-primary hover:underline disabled:opacity-60"
              >
                {resending ? "Renvoi…" : "Renvoyer le code"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onVerify}
                disabled={verifying || code.length !== 6}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white ${
                  verifying || code.length !== 6
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                } bg-gradient-to-r from-fm-primary to-fm-primary2`}
              >
                {verifying ? "Vérification…" : "Confirmer"}
              </button>
            </div>

            <p className="text-xs text-skin-muted text-center">
              Tu n’as rien reçu ? Vérifie tes spams ou renvoie le code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
