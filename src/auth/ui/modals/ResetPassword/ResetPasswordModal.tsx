// src/auth/ui/modals/ResetPassword/ResetPasswordModal.tsx
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import StepRequest from "./StepRequest";
import StepNewPass from "./StepNewPass";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/Notification";
import { requestReset, verifyReset } from "../../../lib/password";

type Step = "request" | "newpass";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; text: string };

/** Helper type-safe pour extraire un message d’erreur */
function getErrorMessage(err: unknown, fallback = "Une erreur est survenue") {
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute top-4 right-4 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-lg ring-1 cursor-pointer",
            t.kind === "success" &&
              "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 ring-emerald-500/30",
            t.kind === "error" &&
              "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30",
            t.kind === "info" &&
              "bg-sky-500/10 text-sky-800 dark:text-sky-200 ring-sky-500/30",
          ].join(" ")}
          onClick={() => onDismiss(t.id)}
          role="status"
          aria-live="polite"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export default function ResetPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Step 1 (email + code)
  const [email, setEmail] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [sending, setSending] = useState(false);
  const [verifErr, setVerifErr] = useState<string | null>(null);

  // Step 2 (new password)
  const [step, setStep] = useState<Step>("request");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const codeRef = useRef<HTMLInputElement>(null);

  // Toasts internes au modal
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (kind: ToastKind, text: string, ttl = 3200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, kind, text }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      ttl
    );
  };
  const dismissToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // Reset local state à la fermeture
  useEffect(() => {
    if (!open) {
      setEmail("");
      setResetId(null);
      setCodeSent(false);
      setCodeInput("");
      setSending(false);
      setVerifErr(null);
      setStep("request");
      setPwd("");
      setPwd2("");
      setSaving(false);
      setErr(null);
      setToasts([]);
    }
  }, [open]);

  if (!open) return null;

  const closeAll = () => onClose();

  const sendCode = async () => {
    setVerifErr(null);
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setVerifErr("Entre une adresse email valide.");
      return;
    }
    try {
      setSending(true);
      const r = await requestReset(email.trim());
      if (!r?.ok) {
        throw new Error(r?.error || "Envoi du code impossible");
      }
      setResetId(r.resetId ?? null);
      setCodeSent(true);
      pushToast("success", `Code envoyé à ${r.masked || email}`);
      setTimeout(() => codeRef.current?.focus(), 30);
    } catch (e: unknown) {
      const msg = getErrorMessage(e, "Envoi du code impossible");
      setVerifErr(msg);
      pushToast("error", msg);
    } finally {
      setSending(false);
    }
  };

  // On ne valide pas le code côté serveur ici : la vérification se fait avec le nouveau mdp (endpoint /verify)
  const goNextIfCodeFilled = () => {
    if (!codeSent) {
      setVerifErr("Envoie d’abord le code.");
      return;
    }
    if (!codeInput || codeInput.length < 4) {
      setVerifErr("Saisis le code reçu par email.");
      return;
    }
    setVerifErr(null);
    setStep("newpass");
  };

  const saveNewPassword = async () => {
    setErr(null);
    if (!resetId) {
      setErr("Session de réinitialisation introuvable. Recommence.");
      return;
    }
    if (pwd.length < 8) {
      setErr("Mot de passe trop court (min. 8 caractères).");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSaving(true);
      const r = await verifyReset(resetId, codeInput.trim(), pwd);
      if (!r?.ok || r?.done !== true) {
        throw new Error(r?.error || "Échec de la réinitialisation");
      }
      notifySuccess("Mot de passe mis à jour", "Succès");
      closeAll();
      // Ouvre l’auth en mode connexion
      type OpenAccountDetail = { mode: "signin" | "signup" };
      window.dispatchEvent(
        new CustomEvent<OpenAccountDetail>("fm:open-account", {
          detail: { mode: "signin" },
        })
      );
    } catch (e: unknown) {
      const msg = getErrorMessage(
        e,
        "Impossible de mettre à jour le mot de passe."
      );
      setErr(msg);
      notifyError(msg, "Oups");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 backdrop-blur-2xl" onClick={closeAll} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Réinitialiser le mot de passe"
          className="relative w-full max-w-md rounded-2xl bg-skin-surface text-skin-base ring-1 ring-skin-border/20 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border/15">
            <h3 className="text-base font-semibold">
              Réinitialiser le mot de passe
            </h3>
            <button
              type="button"
              aria-label="Fermer"
              className="rounded-full p-2 text-skin-muted hover:text-skin-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
              onClick={closeAll}
            >
              <IoMdClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {step === "request" ? (
              <StepRequest
                email={email}
                setEmail={setEmail}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                codeRef={codeRef}
                codeSent={codeSent}
                sending={sending}
                verifErr={verifErr}
                onSendCode={sendCode}
                onVerify={goNextIfCodeFilled} // passe à l’étape 2
              />
            ) : (
              <StepNewPass
                pwd={pwd}
                setPwd={setPwd}
                pwd2={pwd2}
                setPwd2={setPwd2}
                err={err}
                saving={saving}
                onSave={saveNewPassword} // appelle /verify
                onBack={() => {
                  setStep("request");
                  setErr(null);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
