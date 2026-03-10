// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\finance\AccountTab\AccountModal.tsx
import { useRef, useState } from "react";
import { Field, Modal } from "./ui";
import type { Account } from "../core/types";

export default function AccountModal({
  open,
  onClose,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: Pick<Account, "name" | "initial" | "description">;
  onSubmit: (data: {
    name: string;
    initial: number;
    description?: string;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [initialStr, setInitialStr] = useState<string>(
    typeof initial?.initial === "number" ? String(initial.initial) : "0"
  );
  const [desc, setDesc] = useState(initial?.description || "");
  const prevOpen = useRef(open);

  // reset state à l'ouverture
  if (open !== prevOpen.current) {
    prevOpen.current = open;
    if (open) {
      setName(initial?.name || "");
      setInitialStr(
        typeof initial?.initial === "number" ? String(initial.initial) : "0"
      );
      setDesc(initial?.description || "");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const cleaned = initialStr.replace(",", ".");
          const n = Number(cleaned);
          onSubmit({
            name: name.trim(),
            initial: Number.isFinite(n) ? n : 0,
            description: desc.trim(),
          });
        }}
        className="space-y-3"
      >
        <Field label="Nom du compte">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Compte bancaire"
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </Field>

        <Field label="Solde initial">
          <input
            type="text"
            inputMode="decimal"
            value={initialStr}
            onChange={(e) => {
              const safe = e.target.value.replace(/[^0-9.,]/g, "");
              setInitialStr(safe);
            }}
            placeholder="Ex: 50000"
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </Field>

        <Field
          label="Description"
          help="Ex: Compte utilisé pour les dépenses mensuelles"
        >
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </Field>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg px-4 bg-fm-primary text-skin-primary-foreground text-sm font-semibold hover:opacity-95"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
