import React, { useMemo, useState } from "react";
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";
import { validateEmailStrict } from "./emailValidator";

/* ----------------------------- Input de base ----------------------------- */

type BaseProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  /** classes pour l’input (ex: "pl-9" si tu ajoutes une icône) */
  className?: string;
  /** classes pour le <label> conteneur */
  labelClassName?: string;
};

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  className,
  labelClassName,
}: BaseProps) {
  return (
    <label className={`block text-sm mb-3 ${labelClassName ?? ""}`}>
      <span className="block text-skin-base font-medium mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl px-3 py-2
          ring-1 ring-skin-border/30 focus:ring-2 focus:ring-skin-ring
          bg-white/90 dark:bg-white/10 outline-none
          ${className ?? ""}`}
      />
    </label>
  );
}

/* ----------------------------- Email sécurisé ---------------------------- */

type EmailInputProps = Omit<BaseProps, "type"> & {
  onValidChange?: (valid: boolean) => void;
};

export function EmailInput({
  label = "Email",
  value,
  onChange,
  autoComplete = "email",
  placeholder = "vous@exemple.com",
  required = true,
  className,
  labelClassName,
  onValidChange,
}: EmailInputProps) {
  const { valid, reason } = useMemo(() => validateEmailStrict(value), [value]);

  // remonte l’état de validité si demandé
  React.useEffect(() => {
    onValidChange?.(valid);
  }, [valid, onValidChange]);

  const showError = value.length > 0 && !valid;

  return (
    <label className={`block text-sm mb-3 ${labelClassName ?? ""}`}>
      <span className="block text-skin-base font-medium mb-1">{label}</span>
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? "email-error" : undefined}
        className={`w-full rounded-xl px-3 py-2 outline-none
          ring-1 ${
            showError
              ? "ring-red-500/50 focus:ring-red-500"
              : "ring-skin-border/30 focus:ring-skin-ring"
          }
          bg-white/90 dark:bg-white/10
          ${className ?? ""}`}
      />
      {showError && (
        <div
          id="email-error"
          role="alert"
          className="mt-1 flex items-center gap-1 text-xs text-red-600"
        >
          <IoCloseCircle className="w-4 h-4 shrink-0" />
          <span>{reason}</span>
        </div>
      )}
    </label>
  );
}

/* -------------------------- Mot de passe sécurisé ------------------------ */

type PasswordInputProps = Omit<BaseProps, "type"> & {
  minLength?: number; // par défaut 8 (aligné au reste du code)
  /** règles obligatoires (toutes true par défaut) */
  requireLower?: boolean;
  requireUpper?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  /** callback optionnel avec la validité totale */
  onValidChange?: (valid: boolean) => void;
};

export function PasswordInput({
  label = "Mot de passe",
  value,
  onChange,
  autoComplete = "new-password",
  placeholder = "••••••••",
  required = true,
  className,
  labelClassName,
  minLength = 8,
  requireLower = true,
  requireUpper = true,
  requireNumber = true,
  requireSpecial = true,
  onValidChange,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  const checks = useMemo(() => {
    const v = value;
    return {
      len: v.length >= minLength,
      lower: /[a-z]/.test(v),
      upper: /[A-Z]/.test(v),
      num: /[0-9]/.test(v),
      special: /[^A-Za-z0-9]/.test(v),
      nospace: !/\s/.test(v),
    };
  }, [value, minLength]);

  const requiredOk =
    checks.len &&
    checks.nospace &&
    (!requireLower || checks.lower) &&
    (!requireUpper || checks.upper) &&
    (!requireNumber || checks.num) &&
    (!requireSpecial || checks.special);

  React.useEffect(() => {
    onValidChange?.(requiredOk);
  }, [requiredOk, onValidChange]);

  const totalRules =
    2 + // len + nospace
    (requireLower ? 1 : 0) +
    (requireUpper ? 1 : 0) +
    (requireNumber ? 1 : 0) +
    (requireSpecial ? 1 : 0);

  const passed =
    (checks.len ? 1 : 0) +
    (checks.nospace ? 1 : 0) +
    (requireLower && checks.lower ? 1 : 0) +
    (requireUpper && checks.upper ? 1 : 0) +
    (requireNumber && checks.num ? 1 : 0) +
    (requireSpecial && checks.special ? 1 : 0);

  const percent = Math.round((passed / totalRules) * 100);
  const bar =
    percent >= 90
      ? "bg-green-500"
      : percent >= 70
      ? "bg-emerald-500"
      : percent >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className={`text-sm mb-3 ${labelClassName ?? ""}`}>
      <label className="block">
        <span className="block text-skin-base font-medium mb-1">{label}</span>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            placeholder={placeholder}
            required={required}
            className={`w-full rounded-xl pr-10 pl-3 py-2 outline-none
              ring-1 ${
                requiredOk
                  ? "ring-skin-border/30 focus:ring-skin-ring"
                  : "ring-red-500/50 focus:ring-red-500"
              }
              bg-white/90 dark:bg-white/10
              ${className ?? ""}`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={
              show ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            className="absolute inset-y-0 right-0 px-3 grid place-items-center text-skin-muted hover:text-skin-base"
          >
            {show ? (
              <IoEyeOffOutline className="w-5 h-5" />
            ) : (
              <IoEyeOutline className="w-5 h-5" />
            )}
          </button>
        </div>
      </label>

      {/* jauge */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-skin-border/20 overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${percent}%` }} />
      </div>

      {/* checklist */}
      <ul className="mt-2 space-y-1 text-xs">
        <Rule ok={checks.len} text={`Au moins ${minLength} caractères`} />
        {requireLower && (
          <Rule ok={checks.lower} text="Une lettre minuscule (a–z)" />
        )}
        {requireUpper && (
          <Rule ok={checks.upper} text="Une lettre majuscule (A–Z)" />
        )}
        {requireNumber && <Rule ok={checks.num} text="Un chiffre (0–9)" />}
        {requireSpecial && (
          <Rule ok={checks.special} text="Un caractère spécial (!@#$…)" />
        )}
        <Rule ok={checks.nospace} text="Sans espace" />
      </ul>
    </div>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li
      className={`flex items-center gap-1 ${
        ok ? "text-emerald-600" : "text-skin-muted"
      }`}
    >
      {ok ? (
        <IoCheckmarkCircle className="w-4 h-4 shrink-0" />
      ) : (
        <IoCloseCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{text}</span>
    </li>
  );
}
