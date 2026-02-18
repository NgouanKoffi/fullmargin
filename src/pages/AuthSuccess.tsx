// src/pages/AuthSuccess.tsx
import { useEffect, useRef } from "react";
import { notifyError } from "../components/Notification";
import Lottie from "lottie-react";
import okayAnim from "../assets/lottiefile/okay.json";
import { useAuth } from "../auth/AuthContext";
import type { User } from "../auth/types";

function readAndClearIntent(): string | null {
  try {
    const k1 = "fm:auth:intent";
    const k2 = "fm:oauth:from";
    const raw = localStorage.getItem(k1) || localStorage.getItem(k2);
    if (raw) {
      localStorage.removeItem(k1);
      localStorage.removeItem(k2);
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function sanitizeRedirect(url: string | null | undefined): string | null {
  try {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) {
      return u.pathname + u.search + u.hash;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// 👇 petit helper pour lire AUSSI le hash (#token=...)
function getParamsFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);

  // si déjà dans la query → on renvoie ça
  if (searchParams.get("token")) {
    return searchParams;
  }

  // sinon on regarde dans le hash
  const hash = window.location.hash; // "#token=...&expiresAt=..."
  if (hash && hash.startsWith("#")) {
    const hashParams = new URLSearchParams(hash.slice(1));
    return hashParams;
  }

  return searchParams;
}

export default function AuthSuccess() {
  const { setSession } = useAuth();
  const ranRef = useRef(false);

  // garder le thème
  useEffect(() => {
    const theme =
      localStorage.getItem("fm-theme") ||
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = getParamsFromLocation();

    const token = params.get("token");
    const userParam = params.get("user");
    const expiresAtParam = params.get("expiresAt");
    const expiresInParam =
      params.get("expiresIn") || params.get("expiresInSec");

    if (!token || !userParam || (!expiresAtParam && !expiresInParam)) {
      notifyError("Connexion invalide ou incomplète.");
      return;
    }

    try {
      let parsedUserRaw: unknown;
      try {
        parsedUserRaw = JSON.parse(userParam);
      } catch {
        parsedUserRaw = JSON.parse(decodeURIComponent(userParam));
      }

      const isRecord = (v: unknown): v is Record<string, unknown> =>
        v !== null && typeof v === "object";

      if (!isRecord(parsedUserRaw)) {
        notifyError("Données d’authentification invalides.");
        return;
      }

      const raw = parsedUserRaw as Record<string, unknown>;
      const id = typeof raw.id === "string" ? raw.id : "";
      const email = typeof raw.email === "string" ? raw.email : "";
      const fullName =
        typeof raw.fullName === "string"
          ? raw.fullName
          : typeof raw.name === "string"
          ? raw.name
          : "";
      const roles = Array.isArray(raw.roles)
        ? raw.roles.filter((r): r is string => typeof r === "string")
        : [];

      const toMs = (n: number) => (n < 1e12 ? n * 1000 : n);
      let expMs: number | null = null;

      if (expiresAtParam) {
        const rawExp = Number(expiresAtParam);
        if (Number.isFinite(rawExp)) expMs = toMs(rawExp);
      }
      if (!expMs && expiresInParam) {
        const sec = Number(expiresInParam);
        if (Number.isFinite(sec)) expMs = Date.now() + sec * 1000;
      }
      if (!id || !email || !Number.isFinite(expMs as number)) {
        notifyError("Données d’authentification invalides.");
        return;
      }
      if ((expMs as number) <= Date.now()) {
        expMs = Date.now() + 15 * 60 * 1000;
      }

      const user: User = {
        id,
        email,
        fullName,
        roles,
        ...(raw as Record<string, unknown>),
      } as unknown as User;

      setSession({ token, user, expiresAt: expMs as number });

      const intent = sanitizeRedirect(readAndClearIntent());
      setTimeout(() => {
        window.location.replace(intent || "/");
      }, 600);
    } catch (err) {
      console.error("Erreur parsing AuthSuccess:", err);
      notifyError("Erreur pendant l’authentification.");
    }
  }, [setSession]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-skin-bg text-skin-base transition-colors duration-300">
      <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
        <Lottie animationData={okayAnim} loop={false} autoplay />
      </div>
    </main>
  );
}
