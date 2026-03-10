// src/pages/admin/services/BrevoEmails/EmailChoice.tsx
import { useMemo, useState } from "react";
import { Card, SectionTitle } from "../tabs/SharedComponents";
import {
  HiMiniEnvelope,
  HiMiniClipboardDocument,
  HiMiniCheckBadge,
  HiMiniEye,
  HiMiniEyeSlash,
} from "react-icons/hi2";

import type { EmailAccount } from "./brevoEmails";
import { BREVO_EMAILS } from "./brevoEmails";

/* ---------- Badge “Vérifié” ---------- */
function VerifiedBadge({ on = false }: { on?: boolean }) {
  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
      <HiMiniCheckBadge className="h-4 w-4" />
      Vérifié
    </span>
  );
}

/* ---------- Carte d’un expéditeur ---------- */
function EmailCard({
  acc,
  onCopyEmail,
  onCopyPassword,
}: {
  acc: EmailAccount;
  onCopyEmail: (email: string) => void;
  onCopyPassword: (pwd: string) => void;
}) {
  const [reveal, setReveal] = useState(false);
  const hasPwd = !!(acc.password && acc.password.trim());

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur p-4 sm:p-5">
      {/* Accent */}
      <div className="absolute left-0 top-0 h-full w-px sm:w-1.5 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-white/70 dark:bg-slate-900/50 shadow-sm">
          <HiMiniEnvelope className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                {acc.label}
              </p>
              <p className="text-[13px] text-slate-600 dark:text-slate-300 break-words">
                &lt;{acc.email}&gt;
              </p>
            </div>
            <VerifiedBadge on={acc.verified} />
          </div>

          {/* Ligne actions email */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCopyEmail(acc.email)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <HiMiniClipboardDocument className="h-4 w-4" />
              Copier l’adresse
            </button>
          </div>

          {/* Bloc mot de passe */}
          <div className="mt-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mot de passe SMTP
            </p>

            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <input
                  readOnly
                  value={hasPwd ? (reveal ? acc.password! : "••••••••••••••") : "—"}
                  type={reveal ? "text" : "password"}
                  className="w-full sm:max-w-md rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  className="inline-flex items-center justify-center h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs"
                  disabled={!hasPwd}
                  title={reveal ? "Masquer" : "Afficher"}
                >
                  {reveal ? (
                    <HiMiniEyeSlash className="h-4 w-4" />
                  ) : (
                    <HiMiniEye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => hasPwd && onCopyPassword(acc.password!)}
                  disabled={!hasPwd}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <HiMiniClipboardDocument className="h-4 w-4" />
                  Copier le mot de passe
                </button>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Astuce : stocke les secrets côté serveur. En dev, utilise
              <code className="mx-1">VITE_BREVO_SMTP_PWD_PODCAST</code> et
              <code className="ml-1">VITE_BREVO_SMTP_PWD_NOREPLY</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Composant principal ---------- */
export default function EmailChoice({
  accounts,
  title = "Expéditeurs (Brevo)",
}: {
  accounts?: EmailAccount[];
  title?: string;
}) {
  // source par défaut = BREVO_EMAILS (module partagé)
  const list = useMemo(() => accounts ?? BREVO_EMAILS, [accounts]);

  const copy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <SectionTitle>{title}</SectionTitle>

      <Card className="space-y-3 sm:space-y-4">
        <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">
            Liste des expéditeurs disponibles pour l’envoi d’emails transactionnels.
            Les mots de passe sont masqués par défaut.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {list.map((acc) => (
            <EmailCard
              key={acc.id}
              acc={acc}
              onCopyEmail={copy}
              onCopyPassword={copy}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}