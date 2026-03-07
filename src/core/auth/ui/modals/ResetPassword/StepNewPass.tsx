import { useState } from "react";
import { PasswordInput } from "../../forms/Input";

export default function StepNewPass({
  pwd,
  setPwd,
  pwd2,
  setPwd2,
  err,
  saving,
  onSave,
  onBack,
}: {
  pwd: string;
  setPwd: (v: string) => void;
  pwd2: string;
  setPwd2: (v: string) => void;
  err: string | null;
  saving: boolean;
  onSave: () => Promise<void> | void; // le parent notifie & gère les erreurs
  onBack: () => void;
}) {
  const [validPwd, setValidPwd] = useState(false);

  const canSubmit = validPwd && pwd.length >= 8 && pwd === pwd2;

  return (
    <div className="space-y-4">
      <PasswordInput
        value={pwd}
        onChange={setPwd}
        onValidChange={setValidPwd}
        autoComplete="new-password"
        placeholder="••••••••"
        label="Nouveau mot de passe"
      />

      <PasswordInput
        value={pwd2}
        onChange={setPwd2}
        autoComplete="new-password"
        placeholder="••••••••"
        label="Confirmer le mot de passe"
        requireLower={false}
        requireUpper={false}
        requireNumber={false}
        requireSpecial={false}
        onValidChange={() => {}}
      />

      {err && <div className="text-sm text-red-600">{err}</div>}

      <button
        type="button"
        onClick={() => onSave()}
        disabled={saving || !canSubmit}
        className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white ${
          saving || !canSubmit ? "opacity-70 cursor-not-allowed" : ""
        } bg-gradient-to-r from-fm-primary to-fm-primary2`}
      >
        {saving ? "Mise à jour…" : "Définir le nouveau mot de passe"}
      </button>

      <p className="text-xs text-skin-muted text-center">
        Tu t’es trompé de code ?{" "}
        <button type="button" onClick={onBack} className="text-fm-primary hover:underline">
          Revenir à l’étape précédente
        </button>
      </p>
    </div>
  );
}