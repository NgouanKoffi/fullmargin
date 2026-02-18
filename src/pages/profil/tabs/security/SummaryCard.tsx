// src/pages/profil/tabs/security/SummaryCard.tsx
import { HiInformationCircle } from "react-icons/hi2";
import Card from "./ui/Card";
import Chip from "./ui/Chip";
import SectionTitle from "./ui/SectionTitle";

export default function SummaryCard({
  isGoogleLinked,
  localEnabled,
  twoFAEnabled,
}: {
  isGoogleLinked: boolean;
  localEnabled: boolean;
  twoFAEnabled: boolean;
}) {
  const connectionLabel = isGoogleLinked
    ? "Google"
    : localEnabled
    ? "Email + mot de passe"
    : "Email";
  const twoFALabel = twoFAEnabled ? "Activée" : "Désactivée";

  return (
    <Card>
      <SectionTitle title="Sécurité du compte" />

      {/* Grille : gauche = infos, droite = bandeau d'info */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Bloc gauche (2 colonnes en large) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Ligne Connexion */}
          <div className="flex items-center justify-between rounded-md ring-1 ring-skin-border/25 bg-white dark:bg-slate-900 px-3 py-2">
            <span className="text-sm text-skin-muted">Connexion</span>
            <Chip tone={isGoogleLinked ? "primary" : "slate"}>{connectionLabel}</Chip>
          </div>

          {/* Ligne 2FA */}
          <div className="flex items-center justify-between rounded-md ring-1 ring-skin-border/25 bg-white dark:bg-slate-900 px-3 py-2">
            <span className="text-sm text-skin-muted">2FA</span>
            <Chip tone={twoFAEnabled ? "green" : "amber"}>{twoFALabel}</Chip>
          </div>
        </div>

        {/* Bloc droite : bandeau d'information (uniquement si Google lié) */}
        {isGoogleLinked ? (
          <div className="rounded-md ring-1 ring-skin-border/25 bg-slate-50 dark:bg-slate-800/70 px-4 py-3 text-sm text-skin-muted">
            <div className="flex items-start gap-2">
              <HiInformationCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="leading-snug">
                La 2FA est gérée automatiquement pour les comptes Google.
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-1" />
        )}
      </div>
    </Card>
  );
}
