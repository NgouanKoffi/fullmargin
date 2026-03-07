// C:\Users\ADMIN\Desktop\fullmargin-site\src\auth\ui\forms\SignInForm.tsx
import { useState } from "react";
import { EmailInput } from "./Input";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import TermsNote from "../TermsNote";

export default function SignInForm({
  loading,
  onSubmit,
  onSwitchToSignUp,
  onForgotPassword,
}: {
  loading: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchToSignUp: () => void;
  onForgotPassword?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const isFormValid = emailValid && pwd.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isFormValid) onSubmit(email, pwd);
      }}
      className="space-y-3"
    >
      <EmailInput
        label="Email"
        value={email}
        onChange={setEmail}
        onValidChange={setEmailValid}
      />

      <label className="block text-sm mb-3">
        <span className="block text-skin-base font-medium mb-1">
          Mot de passe
        </span>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="w-full rounded-xl px-3 pr-10 py-2 outline-none
              ring-1 ring-skin-border/30 focus:ring-2 focus:ring-skin-ring
              bg-white/90 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={
              showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            className="absolute inset-y-0 right-0 px-3 grid place-items-center text-skin-muted hover:text-skin-base"
          >
            {showPwd ? (
              <IoEyeOffOutline className="w-5 h-5" />
            ) : (
              <IoEyeOutline className="w-5 h-5" />
            )}
          </button>
        </div>
      </label>

      <div className="flex justify-end -mt-2">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs text-fm-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring rounded"
          aria-label="Réinitialiser le mot de passe"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || !isFormValid}
        className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white ${
          loading || !isFormValid ? "opacity-70 cursor-not-allowed" : ""
        } bg-gradient-to-r from-fm-primary to-fm-primary2`}
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-xs text-skin-muted text-center">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-fm-primary font-medium hover:underline"
        >
          Créer un compte
        </button>
      </p>

      <TermsNote />
    </form>
  );
}
