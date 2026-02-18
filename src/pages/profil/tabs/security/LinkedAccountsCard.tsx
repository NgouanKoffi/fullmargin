// src/pages/profil/tabs/security/LinkedAccountsCard.tsx
import { useMemo, useState } from "react";
import {
  HiArrowTopRightOnSquare,
  HiEye,
  HiEyeSlash,
  HiLink,
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
} from "react-icons/hi2";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import getBearer from "./helpers/getBearer";
import cx from "../../utils/cx";
import { API_BASE } from "../../../../lib/api";
import { notifyError, notifySuccess } from "../../../../components/Notification";
import { useAuth } from "../../../../auth/AuthContext";

/* ---------- Helpers validation & UI ---------- */
const hasLower = (s = "") => /[a-z]/.test(s);
const hasUpper = (s = "") => /[A-Z]/.test(s);
const hasDigit = (s = "") => /[0-9]/.test(s);
const hasSpecial = (s = "") => /[^A-Za-z0-9\s]/.test(s);
const hasNoSpace = (s = "") => !/\s/.test(s);

function strengthScore(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (hasLower(pwd)) score++;
  if (hasUpper(pwd)) score++;
  if (hasDigit(pwd)) score++;
  if (hasSpecial(pwd)) score++;
  if (pwd.length >= 12) score = Math.min(5, score + 1);
  return Math.min(score, 5);
}
function strengthLabel(score: number) {
  if (score <= 1) return "Très faible";
  if (score === 2) return "Faible";
  if (score === 3) return "Moyen";
  if (score === 4) return "Fort";
  return "Très fort";
}
function strengthPercent(score: number) {
  return `${(score / 5) * 100}%`;
}

export default function LinkedAccountsCard({ isGoogleLinked }: { isGoogleLinked: boolean }) {
  const { setSession } = useAuth();

  /* ---------- État nouveau mot de passe (pour délier) ---------- */
  const [newPwd, setNewPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const rules = useMemo(
    () => ({
      length: newPwd.length >= 8,
      lower: hasLower(newPwd),
      upper: hasUpper(newPwd),
      digit: hasDigit(newPwd),
      special: hasSpecial(newPwd),
      nospace: hasNoSpace(newPwd),
    }),
    [newPwd]
  );

  const allValid = useMemo(
    () => rules.length && rules.lower && rules.upper && rules.digit && rules.special && rules.nospace,
    [rules]
  );

  const score = useMemo(() => strengthScore(newPwd), [newPwd]);
  const canUnlink = isGoogleLinked && allValid && !unlinkLoading;

  const unlinkGoogle = async () => {
    if (!isGoogleLinked) return;
    if (!allValid) return notifyError("Ton mot de passe ne respecte pas toutes les règles.");
    try {
      setUnlinkLoading(true);
      const resp = await fetch(`${API_BASE}/auth/google/unlink`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: getBearer() },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        const msg = data?.error || "Impossible de délier.";
        if (msg === "SET_PASSWORD_REQUIRED") return notifyError("Définis un mot de passe (min. 8) pour délier Google.");
        return notifyError(msg);
      }
      const session = data.session;
      if (session?.token && session?.user) setSession(session);
      notifySuccess("Compte Google délié. Tu peux maintenant te connecter avec email + mot de passe.");
      setNewPwd("");
    } catch {
      notifyError("Erreur réseau pendant le délien.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/google/link-token`, {
        method: "POST",
        headers: { Authorization: getBearer() },
      });
      const data = await r.json();
      if (!r.ok || !data?.ok || !data.linkToken)
        return notifyError(data?.error || "Préparation du lien Google impossible.");
      const lt = encodeURIComponent(data.linkToken);
      window.location.href = `${API_BASE}/auth/google/start?mode=link&lt=${lt}`;
    } catch {
      notifyError("Erreur réseau pendant la préparation du lien.");
    }
  };

  return (
    <Card>
      <SectionTitle title="Comptes liés" />
      <div className="mt-3 grid grid-cols-1 gap-4">
        {/* Ligne Google */}
        <div
          className={cx(
            "rounded-lg ring-1 ring-skin-border/25 border border-skin-border/40",
            // ✅ fond opaque, pas de gradient translucide
            "bg-white dark:bg-slate-900 p-3 sm:p-4"
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Logo Google */}
                <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.7 6.1 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.7 6.1 29.7 4 24 4 16 4 9.1 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 36.5 26.8 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.7 16 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3C34.8 31.4 30 35 24 35c-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.7 16 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
                <div className="text-sm">
                  <div className="font-medium text-skin-base">Google</div>
                  <div className="text-skin-muted">{isGoogleLinked ? "Compte lié" : "Non lié"}</div>
                </div>
              </div>

              {isGoogleLinked ? (
                <button
                  onClick={unlinkGoogle}
                  disabled={!canUnlink}
                  className={cx(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/25 inline-flex items-center gap-1",
                    "bg-rose-50 hover:bg-rose-100 text-rose-700",
                    (!canUnlink || unlinkLoading) && "opacity-60 cursor-not-allowed"
                  )}
                  title={!allValid ? "Saisis un mot de passe qui respecte toutes les règles" : undefined}
                >
                  <HiLink className="w-4 h-4 rotate-45" />
                  {unlinkLoading ? "Déliage…" : "Délier Google"}
                </button>
              ) : (
                <button
                  onClick={handleLinkGoogle}
                  className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/25 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                >
                  Lier à Google <HiArrowTopRightOnSquare className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Champ mot de passe + aide : ✅ toujours empilés */}
            {isGoogleLinked && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-skin-muted mb-1">
                    Nouveau mot de passe (obligatoire pour délier)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Au moins 8 caractères, min/maj, chiffre, spécial, sans espace"
                      className={cx(
                        "w-full rounded-lg bg-slate-100 dark:bg-slate-800 ring-1 p-3 pr-10 text-sm outline-none",
                        "ring-skin-border/30 focus:ring-fm-primary/35"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-2 grid place-items-center p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/70"
                      onClick={() => setShowNewPwd((v) => !v)}
                      title={showNewPwd ? "Masquer" : "Afficher"}
                    >
                      {showNewPwd ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Barre de robustesse */}
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cx(
                          "h-full transition-all",
                          score <= 2 && "bg-rose-500",
                          score === 3 && "bg-amber-500",
                          score >= 4 && "bg-emerald-500"
                        )}
                        style={{ width: strengthPercent(score) }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-skin-muted">
                      Robustesse : <span className="font-medium">{strengthLabel(score)}</span>
                    </div>
                  </div>
                </div>

                {/* Checklist des règles (reste en 2 colonnes sous l'input) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <Rule ok={rules.length} label="Au moins 8 caractères" />
                  <Rule ok={rules.nospace} label="Sans espace" />
                  <Rule ok={rules.lower} label="Une minuscule (a-z)" />
                  <Rule ok={rules.upper} label="Une majuscule (A-Z)" />
                  <Rule ok={rules.digit} label="Un chiffre (0-9)" />
                  <Rule ok={rules.special} label="Un caractère spécial (!@#$…)" />
                  <div className="sm:col-span-2 mt-1 text-xs text-skin-muted flex items-center gap-2">
                    <HiInformationCircle className="w-4 h-4" />
                    Une fois délié, tu pourras te connecter avec ton email et ce mot de passe.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Sous-composant Règle ---------- */
function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiXCircle className="w-4 h-4 text-rose-500" />}
      <span className={cx("leading-tight", ok ? "text-slate-700 dark:text-slate-300" : "text-skin-muted")}>
        {label}
      </span>
    </div>
  );
}