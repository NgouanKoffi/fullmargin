// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\journal\tabs\journal\JournalForm\index.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { loadSession } from "../../../../../auth/lib/storage";
import {
  useJournalFormState,
  type JournalEntryExt,
} from "./useJournalFormState";
import { useJournalOptions } from "./OptionsLoader";
import { FormBody } from "./FormBody";
import type { JournalEntry } from "../../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: JournalEntryExt) => void;
  initial?: Partial<JournalEntry>;
};

export default function JournalForm({
  open,
  onClose,
  onSubmit,
  initial,
}: Props) {
  const {
    state,
    setField,
    handleResultMoneyChange,
    isLoss,
    isGain,
    isNull,
    moneyMsg,
    addImages,
    removeImage,
    isValid,
  } = useJournalFormState({ initial: initial ?? {} });

  const { accounts, markets, strats } = useJournalOptions();
  const session = typeof window !== "undefined" ? loadSession() : null;

  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  if (!session) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-3">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Connexion requise</h3>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tu dois être connecté pour créer ou modifier un journal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold">
            {initial?.id ? "Modifier le journal" : "Nouveau journal"}
          </h3>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <FormBody
          state={state}
          setField={setField}
          handleResultMoneyChange={handleResultMoneyChange}
          accounts={accounts}
          markets={markets}
          strats={strats}
          isLoss={isLoss}
          isGain={isGain}
          isNull={isNull}
          moneyMsg={moneyMsg}
          addImages={addImages}
          removeImage={removeImage}
        />

        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Quitter
          </button>
          <button
            disabled={!isValid || submitting}
            onClick={() => {
              if (!isValid || submitting) return;
              setSubmitting(true);
              const images = state.images?.slice(0, 5) ?? [];
              onSubmit({
                ...state,
                images,
                imageDataUrl: images[0] || state.imageDataUrl || "",
              });
              // on laisse le parent fermer, donc pas besoin de remettre à false ici
            }}
            className="h-10 px-4 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
