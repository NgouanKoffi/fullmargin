import { useState } from "react";
import Input from "./Input";
import { EmailInput, PasswordInput } from "./Input";
import TermsNote from "../TermsNote";

export default function SignUpForm({
  loading,
  onSubmit,
  onSwitchToSignIn,
}: {
  loading: boolean;
  onSubmit: (fullName: string, email: string, password: string) => Promise<void>;
  onSwitchToSignIn: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const [emailValid, setEmailValid] = useState(false);
  const [pwdValid, setPwdValid] = useState(false);

  const isFormValid = name.trim().length >= 2 && emailValid && pwdValid;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isFormValid) onSubmit(name.trim(), email.trim(), pwd);
      }}
      className="space-y-3"
    >
      <Input
        label="Nom complet"
        value={name}
        onChange={setName}
        autoComplete="name"
        placeholder="Jane Doe"
      />

      <EmailInput
        label="Email"
        value={email}
        onChange={setEmail}
        onValidChange={setEmailValid}
      />

      <PasswordInput
        label="Mot de passe"
        value={pwd}
        onChange={setPwd}
        onValidChange={setPwdValid}
        autoComplete="new-password"
        placeholder="••••••••"
      />

      <button
        type="submit"
        disabled={loading || !isFormValid}
        className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white ${
          loading || !isFormValid ? "opacity-70 cursor-not-allowed" : ""
        } bg-gradient-to-r from-fm-primary to-fm-primary2`}
      >
        {loading ? "Création…" : "Créer un compte"}
      </button>

      <p className="text-xs text-skin-muted text-center">
        Tu as déjà un compte ?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-fm-primary font-medium hover:underline"
        >
          Se connecter
        </button>
      </p>

      <TermsNote />
    </form>
  );
}
