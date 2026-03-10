import { useEffect, useState } from "react";
import { Field, Modal } from "./ui";
import {
  ymd,
  type Account,
  type Recurrence,
  type Transaction,
  type TxDetail,
  type TxType,
} from "../core/types";

// ---------------- CORE + EXTRA DETAILS ----------------

const CORE_DETAILS: Array<{ value: TxDetail; label: string }> = [
  { value: "epargne", label: "Épargne" },
  { value: "assurance", label: "Assurance" },
  { value: "retrait", label: "Retrait" },
  { value: "dette", label: "Dette" },
  { value: "investissement", label: "Investissement" },
  { value: "autre", label: "Autre" },
];

// ⚠️ AVANT tu avais `value: string` → maintenant c’est bien `TxDetail`
const EXTRA_DETAILS: Array<{ value: TxDetail; label: string }> = [
  { value: "loyer", label: "Loyer" },
  { value: "alimentation", label: "Alimentation" },
  { value: "transport", label: "Transport" },
  { value: "sante", label: "Santé" },
  { value: "education", label: "Éducation" },
  { value: "loisirs", label: "Loisirs" },
  { value: "impots_taxes", label: "Impôts / Taxes" },
  { value: "abonnement", label: "Abonnement" },
  { value: "frais_bancaires", label: "Frais bancaires" },
  { value: "cadeaux_dons", label: "Cadeaux / Dons" },
  { value: "entretien_reparation", label: "Entretien / Réparation" },
  { value: "achat_materiel", label: "Achat de matériel" },
  { value: "frais_service", label: "Frais de service" },
  { value: "voyage_deplacement", label: "Voyage / Déplacement" },
  { value: "frais_professionnels", label: "Frais professionnels" },
];

const ALL_DETAILS = [...CORE_DETAILS, ...EXTRA_DETAILS];

/**
 * Quand on édite :
 * - si le detail stocké en base est un CORE → on le garde
 * - si le detail stocké est un EXTRA → on le garde aussi (loyer, transport…)
 * - si c’est "autre", on essaie de déduire via le commentaire (legacy)
 */
function inferDetailRaw(initial?: Transaction): string {
  if (!initial) return "autre";

  // 1) correspond à un CORE ?
  if (CORE_DETAILS.some((d) => d.value === initial.detail)) {
    return initial.detail;
  }

  // 2) correspond à un EXTRA ?
  const extra = EXTRA_DETAILS.find((d) => d.value === initial.detail);
  if (extra) {
    return extra.value;
  }

  // 3) si c’est "autre", on tente de retrouver un EXTRA via le commentaire (cas anciens)
  if (initial.detail === "autre") {
    const comment = (initial.comment || "").toLowerCase().trim();
    if (comment) {
      const found = EXTRA_DETAILS.find((d) => {
        const label = d.label.toLowerCase();
        return comment === label || comment.includes(label);
      });
      if (found) {
        return found.value;
      }
    }
  }

  // 4) fallback
  return "autre";
}

export default function TxForm({
  open,
  onClose,
  accounts,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  initial?: Transaction;
  onSubmit: (data: {
    accountId: string;
    type: TxType;
    amount: number;
    date: string;
    recurrence: Recurrence;
    detail: TxDetail;
    comment?: string;
  }) => void;
}) {
  const [accountId, setAccountId] = useState<string>("");
  const [type, setType] = useState<TxType>("expense");
  const [amountStr, setAmountStr] = useState<string>("");
  const [date, setDate] = useState<string>(ymd(new Date()));
  const [recurrence, setRecurrence] = useState<Recurrence>("fixe");
  const [detailRaw, setDetailRaw] = useState<string>("autre");
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    const defAcc = initial?.accountId || accounts[0]?.id || "";
    setAccountId(defAcc);
    setType(initial?.type ?? "expense");
    setAmountStr(
      typeof initial?.amount === "number" ? String(initial.amount) : ""
    );
    setDate(initial ? ymd(new Date(initial.date)) : ymd(new Date()));
    setRecurrence(initial?.recurrence ?? "fixe");

    // ✅ maintenant ça respecte aussi les EXTRA_DETAILS
    setDetailRaw(inferDetailRaw(initial ?? undefined));

    setComment(initial?.comment ?? "");
  }, [open, accounts, initial]);

  const inputBase =
    "mt-1 w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 " +
    "bg-white dark:bg-slate-900 px-3 text-sm " +
    "text-slate-900 dark:text-slate-100 " +
    "placeholder-slate-400 dark:placeholder-slate-500 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/40";

  const textareaCls =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 " +
    "bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-y " +
    "text-slate-900 dark:text-slate-100 " +
    "placeholder-slate-400 dark:placeholder-slate-500 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/40";

  function parseAmount(raw: string): number {
    const cleaned = String(raw)
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, "")
      .replace(/,/g, ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.abs(n) : NaN;
  }

  const MAX_COMMENT = 500;
  const count = comment.length;

  const tone =
    type === "expense"
      ? "ring-rose-300/70 bg-rose-50 dark:bg-rose-900/20"
      : "ring-emerald-300/70 bg-emerald-50 dark:bg-emerald-900/20";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Modifier la transaction" : "Nouvelle transaction"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!accountId) {
            alert("Sélectionne un compte.");
            return;
          }
          const amount = parseAmount(amountStr);
          if (!Number.isFinite(amount) || amount <= 0) {
            alert("Montant invalide.");
            return;
          }

          // ✅ ICI LE VRAI FIX :
          // on n’écrase PLUS les EXTRA_DETAILS en "autre"
          const found = ALL_DETAILS.find((d) => d.value === detailRaw);
          const finalDetail: TxDetail = found
            ? (found.value as TxDetail)
            : "autre";

          let finalComment = comment.slice(0, MAX_COMMENT);
          if (!finalComment) {
            const label = found?.label;
            if (label) {
              finalComment = label;
            }
          }

          onSubmit({
            accountId,
            type,
            amount,
            date,
            recurrence,
            detail: finalDetail,
            comment: finalComment,
          });
        }}
        className="space-y-3"
      >
        <div className={`rounded-xl p-3 ring-1 ${tone}`}>
          <div className="text-[12px] font-semibold uppercase tracking-wide mb-1">
            {type === "expense"
              ? "Dépense (soustraction)"
              : "Revenu (addition)"}
          </div>
          <div className="text-[12px] text-slate-600 dark:text-slate-300">
            {type === "expense"
              ? "Le montant sera déduit du solde du compte dans les calculs."
              : "Le montant sera ajouté au solde du compte dans les calculs."}
          </div>
        </div>

        {/* Compte */}
        <Field label="Nom du compte">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className={inputBase}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        {/* Type */}
        <Field label="Type de transaction">
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={[
                "h-10 rounded-lg border text-sm font-semibold whitespace-nowrap",
                type === "expense"
                  ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30"
                  : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={[
                "h-10 rounded-lg border text-sm font-semibold whitespace-nowrap",
                type === "income"
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                  : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              Revenu
            </button>
          </div>
        </Field>

        {/* Montant / Date / Récurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Montant">
            <input
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => {
                const safe = e.target.value.replace(/[^\d\s.,]/g, "");
                setAmountStr(safe);
              }}
              placeholder="Ex: 200 000,50"
              className={inputBase}
              required
            />
          </Field>

          <Field label="Date de la transaction">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={
                inputBase +
                " dark:[color-scheme:dark] [color-scheme:light] appearance-none"
              }
              required
            />
          </Field>
          <Field label="Récurrence">
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className={inputBase}
            >
              <option value="fixe">Fixe</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </Field>
        </div>

        {/* Détail */}
        <Field label="Détail">
          <select
            value={detailRaw}
            onChange={(e) => setDetailRaw(e.target.value)}
            className={inputBase + " capitalize"}
          >
            <optgroup label="Général">
              {CORE_DETAILS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fréquent">
              {EXTRA_DETAILS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>

        {/* Commentaire */}
        <Field label="Commentaire" help="Multiligne, max 500 caractères">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className={textareaCls}
            placeholder="Ex: Loyer, abonnement, prime, etc."
          />
          <div
            className={`mt-1 text-[11px] ${
              count > MAX_COMMENT ? "text-rose-600" : "text-slate-500"
            }`}
          >
            {count}/{MAX_COMMENT}
          </div>
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
