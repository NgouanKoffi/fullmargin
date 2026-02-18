// C:\Users\ADMIN\Desktop\fullmargin-site\src\auth\lib\helpers.ts
import type { Session } from "../types";
import { notifyError } from "../../components/Notification";

export function buildAuthSuccessUrl(session: Session) {
  return (
    `/auth/success?token=${encodeURIComponent(session.token)}` +
    `&expiresAt=${encodeURIComponent(String(session.expiresAt))}` +
    `&user=${encodeURIComponent(JSON.stringify(session.user))}`
  );
}

export function messageForAuthError(code?: string) {
  switch (code) {
    case "ACCOUNT_EXISTS_NEEDS_LINK":
      return "Un compte existe déjà avec cet email. Connecte-toi avec ton email/mot de passe, puis lie Google dans tes paramètres.";
    case "TOKEN_INVALID":
    case "OAUTH_ABORTED":
      return "La connexion Google a été interrompue.";
    default:
      return "La connexion a échoué.";
  }
}

/** Récupère & purge les infos de retour OAuth stockées avant redirection */
export function popOauthReturn() {
  const redirectTo = localStorage.getItem("fm:oauth:from") || "/";
  const openPanel = localStorage.getItem("fm:oauth:open") || "account";
  localStorage.removeItem("fm:oauth:from");
  localStorage.removeItem("fm:oauth:open");
  return { redirectTo, openPanel };
}

/** Affiche l’erreur d’OAuth éventuelle présente dans l’URL et déclenche le modal */
export function handleOauthErrorOnce(flag: { current: boolean }) {
  if (flag.current) return;

  const url = new URL(window.location.href);
  const authError = url.searchParams.get("auth_error");
  if (!authError) return;

  flag.current = true;

  // nettoie l’URL
  url.searchParams.delete("auth_error");
  const qs = url.searchParams.toString();
  window.history.replaceState(
    {},
    "",
    url.pathname + (qs ? `?${qs}` : "") + url.hash
  );

  // notif + ouverture du modal
  notifyError(messageForAuthError(authError));
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
  );

  // retour page d’origine (et panneau)
  const { redirectTo, openPanel } = popOauthReturn();
  setTimeout(() => {
    if (openPanel && openPanel !== "account") {
      window.dispatchEvent(new CustomEvent(`fm:open-${openPanel}`));
    }
    const here =
      window.location.pathname + window.location.search + window.location.hash;
    if (redirectTo && here !== redirectTo) window.location.replace(redirectTo);
  }, 100);
}
