import { useMemo, useState } from "react";
import { HiEye, HiEyeSlash, HiKey, HiCheckCircle, HiXCircle } from "react-icons/hi2";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import Field from "./ui/Field";
import cx from "../../utils/cx";
import { notifyError, notifySuccess } from "../../../../components/Notification";
import { API_BASE } from "../../../../lib/api";
import getBearer from "../security/helpers/getBearer";

/* -------- Helpers de validation -------- */
type PwIssues = {
  length: boolean;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  special: boolean;
  noSpace: boolean;
  notSameAsCurrent: boolean;
  confirmMatch: boolean;
};

const hasLower = (s: string) => /[a-z]/.test(s);
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasDigit = (s: string) => /[0-9]/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9\s]/.test(s);
const hasNoSpace = (s: string) => !/\s/.test(s);

function computeIssues(current: string, next: string, confirm: string): PwIssues {
  return {
    length: next.length >= 8,
    lower: hasLower(next),
    upper: hasUpper(next),
    digit: hasDigit(next),
    special: hasSpecial(next),
    noSpace: hasNoSpace(next),
    notSameAsCurrent: !!next && next !== current,
    confirmMatch: !!next && next === confirm,
  };
}

function strengthScore(next: string): number {
  // score rapide sur 0..4
  let score = 0;
  if (next.length >= 8) score++;
  if (next.length >= 12) score++;
  const variety = [hasLower(next), hasUpper(next), hasDigit(next), hasSpecial(next)].filter(Boolean).length;
  if (variety >= 2) score++;
  if (variety >= 3) score++;
  return Math.min(4, score);
}

function strengthLabel(score: number): string {
  return ["Très faible", "Faible", "Correct", "Bon", "Excellent"][score];
}

/* -------- Composant -------- */
export default function PasswordCard() {
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState<{ current: boolean; next: boolean; confirm: boolean }>({
    current: false,
    next: false,
    confirm: false,
  });
  const [loadingPwd, setLoadingPwd] = useState(false);

  const issues = useMemo(() => computeIssues(pwd.current, pwd.next, pwd.confirm), [pwd]);
  const score = useMemo(() => strengthScore(pwd.next), [pwd.next]);
  const label = useMemo(() => strengthLabel(score), [score]);

  const allValid =
    issues.length &&
    issues.lower &&
    issues.upper &&
    issues.digit &&
    issues.special &&
    issues.noSpace &&
    issues.notSameAsCurrent &&
    issues.confirmMatch &&
    !!pwd.current;

  // Message d’aide contextuel
  const hint = useMemo(() => {
    if (!pwd.next) return "Utilise au moins 8 caractères, mélange lettres, chiffres et symboles.";
    if (!issues.length) return "Au moins 8 caractères.";
    if (!issues.lower) return "Ajoute au moins une lettre minuscule.";
    if (!issues.upper) return "Ajoute au moins une lettre majuscule.";
    if (!issues.digit) return "Ajoute au moins un chiffre.";
    if (!issues.special) return "Ajoute au moins un symbole.";
    if (!issues.noSpace) return "Évite les espaces.";
    if (!issues.notSameAsCurrent) return "Le nouveau mot de passe doit être différent de l’actuel.";
    if (!issues.confirmMatch) return "La confirmation ne correspond pas.";
    return "Parfait, tu peux mettre à jour.";
  }, [pwd, issues]);

  // Coloration de la jauge
  const scoreBarClasses = (i: number) =>
    cx(
      "h-2 rounded-md transition-colors",
      score >= i
        ? i <= 1
          ? "bg-rose-500/80"
          : i === 2
          ? "bg-amber-500/80"
          : "bg-emerald-500/80"
        : "bg-slate-200 dark:bg-slate-700"
    );

  const updatePassword = async () => {
    if (!allValid) {
      notifyError("Corrige les critères avant de continuer.");
      return;
    }

    try {
      setLoadingPwd(true);
      const resp = await fetch(`${API_BASE}/auth/password/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: getBearer() },
        body: JSON.stringify({
          currentPassword: pwd.current,
          newPassword: pwd.next,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        const msg = data?.error || "Mise à jour du mot de passe impossible.";
        notifyError(msg);
        return;
      }
      notifySuccess("Mot de passe mis à jour.");
      setPwd({ current: "", next: "", confirm: "" });
    } catch {
      notifyError("Erreur réseau lors de la mise à jour.");
    } finally {
      setLoadingPwd(false);
    }
  };

  // Liste des règles (temps réel)
  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <HiCheckCircle className="w-4 h-4 text-emerald-600" />
      ) : (
        <HiXCircle className="w-4 h-4 text-rose-500" />
      )}
      <span className={ok ? "text-emerald-700" : "text-skin-muted"}>{text}</span>
    </div>
  );

  return (
    <Card>
      <SectionTitle icon={<HiKey className="w-5 h-5" />} title="Mot de passe" />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field
          type={show.current ? "text" : "password"}
          placeholder="Mot de passe actuel"
          value={pwd.current}
          onChange={(v) => setPwd((x) => ({ ...x, current: v }))}
          right={
            <button
              type="button"
              className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/70"
              onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
              title={show.current ? "Masquer" : "Afficher"}
            >
              {show.current ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          }
        />
        <Field
          type={show.next ? "text" : "password"}
          placeholder="Nouveau mot de passe (min. 8, majuscule, minuscule, chiffre, symbole)"
          value={pwd.next}
          onChange={(v) => setPwd((x) => ({ ...x, next: v }))}
          right={
            <button
              type="button"
              className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/70"
              onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
              title={show.next ? "Masquer" : "Afficher"}
            >
              {show.next ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          }
        />
        <Field
          type={show.confirm ? "text" : "password"}
          placeholder="Confirmer le nouveau"
          value={pwd.confirm}
          onChange={(v) => setPwd((x) => ({ ...x, confirm: v }))}
          right={
            <button
              type="button"
              className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/70"
              onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              title={show.confirm ? "Masquer" : "Afficher"}
            >
              {show.confirm ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      {/* Jauge + règles */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(260px,420px),1fr] gap-4">
        <div>
          <div className="flex gap-1 mb-1">
            <div className={scoreBarClasses(0)} style={{ width: "25%" }} />
            <div className={scoreBarClasses(1)} style={{ width: "25%" }} />
            <div className={scoreBarClasses(2)} style={{ width: "25%" }} />
            <div className={scoreBarClasses(3)} style={{ width: "25%" }} />
          </div>
          <div className="text-[11px] text-skin-muted">{pwd.next ? `Robustesse : ${label}` : "Robustesse : —"}</div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Rule ok={issues.length} text="≥ 8 caractères" />
          <Rule ok={issues.lower} text="1 minuscule" />
          <Rule ok={issues.upper} text="1 majuscule" />
          <Rule ok={issues.digit} text="1 chiffre" />
          <Rule ok={issues.special} text="1 symbole" />
          <Rule ok={issues.noSpace} text="Sans espace" />
          <Rule ok={issues.notSameAsCurrent} text="Différent de l’actuel" />
          <Rule ok={issues.confirmMatch} text="Confirmation identique" />
        </div>
      </div>

      <div className="mt-3 text-xs text-skin-muted">{hint}</div>

      <div className="mt-4">
        <button
          onClick={updatePassword}
          disabled={!allValid || loadingPwd}
          className={cx(
            "rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/25",
            allValid
              ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              : "bg-slate-100/60 text-slate-400 cursor-not-allowed",
            loadingPwd && "opacity-60 cursor-not-allowed"
          )}
        >
          {loadingPwd ? "En cours…" : "Mettre à jour"}
        </button>
      </div>
    </Card>
  );
}