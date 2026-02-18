// src/pages/profil/tabs/security/TwoFactorCard.tsx
import { useState } from "react";
import { HiShieldCheck } from "react-icons/hi2";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import Chip from "./ui/Chip";
import getBearer from "./helpers/getBearer";
import cx from "../../utils/cx";
import { useAuth } from "../../../../auth/AuthContext";
import { API_BASE } from "../../../../lib/api";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/Notification";

export default function TwoFactorCard({
  isGoogleLinked,
  twoFAEnabled,
}: {
  isGoogleLinked: boolean;
  twoFAEnabled: boolean;
}) {
  const { setSession } = useAuth();
  const [loading, setLoading] = useState(false);

  // ✅ MAINTENANCE TERMINÉE : On déverrouille la fonctionnalité
  const TWO_FA_LOCKED = false;

  // On désactive le bouton uniquement si le compte est lié à Google (Google gère sa propre 2FA)
  // ou si le verrouillage global est actif.
  const disabled2FA = TWO_FA_LOCKED || isGoogleLinked;

  const twoFALabel = twoFAEnabled ? "Activée" : "Désactivée";

  const toggle2FA = async () => {
    if (disabled2FA || loading) return;
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/auth/2fa`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBearer(),
        },
        body: JSON.stringify({ enable: !twoFAEnabled }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        return notifyError(
          data?.error || "Impossible de mettre à jour la 2FA.",
        );
      }
      if (data.session?.token && data.session?.user) setSession(data.session);
      notifySuccess(!twoFAEnabled ? "2FA activée." : "2FA désactivée.");
    } catch {
      notifyError("Erreur réseau pendant la mise à jour 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={cx(
        "!bg-white dark:!bg-slate-900 !bg-opacity-100 backdrop-blur-0 supports-[backdrop-filter]:!bg-white",
      )}
    >
      <SectionTitle
        icon={<HiShieldCheck className="w-5 h-5" />}
        title="Authentification à deux facteurs"
      />

      <p className="mt-2 text-sm text-skin-muted">
        Ajoute une seconde étape lors de la connexion (code par email).
      </p>

      {TWO_FA_LOCKED && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Fonction temporairement désactivée (maintenance).
        </p>
      )}

      {isGoogleLinked && !TWO_FA_LOCKED && (
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Géré automatiquement via votre compte Google.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm">
          <span className="mr-2">Statut :</span>
          <Chip tone={twoFAEnabled ? "green" : "amber"}>{twoFALabel}</Chip>
        </div>

        <button
          onClick={toggle2FA}
          disabled={disabled2FA || loading}
          title={
            TWO_FA_LOCKED
              ? "Fonction temporairement désactivée"
              : isGoogleLinked
                ? "Géré par Google"
                : ""
          }
          className={cx(
            "rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/25 transition-colors",
            twoFAEnabled
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
            (disabled2FA || loading) && "cursor-not-allowed opacity-60",
          )}
        >
          {loading ? "En cours…" : twoFAEnabled ? "Désactiver" : "Activer"}
        </button>
      </div>
    </Card>
  );
}
