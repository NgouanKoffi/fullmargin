import { useState, type RefObject } from "react";
import { EmailInput } from "../../forms/Input";
import { HiHashtag, HiPaperAirplane, HiArrowRight, HiArrowPath } from "react-icons/hi2";

export default function StepRequest({
  email,
  setEmail,
  codeInput,
  setCodeInput,
  codeRef,
  codeSent,
  sending,
  verifErr,
  onSendCode,
  onVerify,
}: {
  email: string;
  setEmail: (v: string) => void;
  codeInput: string;
  setCodeInput: (v: string) => void;
  codeRef: RefObject<HTMLInputElement | null>;
  codeSent: boolean;
  sending: boolean;
  verifErr: string | null;
  onSendCode: () => Promise<void>;
  onVerify: () => void;
}) {
  const [emailValid, setEmailValid] = useState(false);

  return (
    <div className="space-y-4">
      <EmailInput
        label="Email"
        value={email}
        onChange={setEmail}
        onValidChange={setEmailValid}
      />

      <div>
        <label className="block text-sm mb-1 font-medium text-skin-base">Code</label>

        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-lg ring-1 ring-skin-border/30 bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <HiHashtag className="w-4.5 h-4.5" />
            </div>
          </div>

          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="••••••"
            disabled={!codeSent}
            className={`w-full h-11 rounded-xl pl-12 pr-3
              ring-1 ring-skin-border/30 focus:ring-2 focus:ring-skin-ring outline-none transition-colors
              ${
                !codeSent
                  ? "bg-skin-muted/10 text-skin-muted cursor-not-allowed"
                  : "bg-white/90 dark:bg-white/10"
              }`}
          />
        </div>

        {codeSent && (
          <div className="mt-2 text-xs flex items-center gap-2 text-emerald-400">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400" />
            <span>Code envoyé. Saisis le code reçu par email pour continuer.</span>
          </div>
        )}
        {verifErr && <div className="mt-2 text-sm text-red-600">{verifErr}</div>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSendCode}
          disabled={sending || !emailValid}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 h-10 text-sm font-semibold text-white
            ${sending || !emailValid ? "opacity-70 cursor-not-allowed" : ""}
            bg-gradient-to-r from-fm-primary to-fm-primary2`}
        >
          {sending ? (
            <>
              <HiArrowPath className="w-4 h-4 animate-spin" />
              Envoi…
            </>
          ) : codeSent ? (
            <>
              <HiArrowPath className="w-4 h-4" />
              Renvoyer le code
            </>
          ) : (
            <>
              <HiPaperAirplane className="w-4 h-4 -rotate-6" />
              Envoyer le code
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onVerify}
          disabled={!codeSent}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 h-10 text-sm font-semibold
            ${
              !codeSent
                ? "opacity-50 cursor-not-allowed bg-skin-tile text-skin-muted"
                : "bg-skin-tile hover:bg-skin-tile-strong text-skin-base"
            }`}
        >
          Continuer
          <HiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}