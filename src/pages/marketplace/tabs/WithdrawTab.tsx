// src/pages/marketplace/tabs/WithdrawTab.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Wallet,
  CreditCard,
  Banknote,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ======================= Config (feature flag) ======================= */
const withdrawalsEnabled = false; // 🔒 En cours de dev → formulaire désactivé

/* ======================= Types ======================= */

type WithdrawMethod = "mobile" | "bank" | "card";

type SellerBalancePayload = {
  available: number;
  pending: number;
  currency: string;
  limits?: { min?: number; max?: number };
  fees?: { fixed?: number; percent?: number };
};

type WithdrawalRow = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "rejected" | "canceled";
  method: WithdrawMethod;
  createdAt: string;
  reference?: string;
  note?: string;
};

type CreateWithdrawalBody = {
  amount: number;
  method: WithdrawMethod;
  recipient: string;
  note?: string;
};

type CreateWithdrawalResponse = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid";
  reference?: string;
  availableBalance?: number;
};

/* ======================= Helpers ======================= */

function fmtMoney(n: number | null | undefined, currency = "USD") {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  try {
    return v.toLocaleString("fr-FR", { style: "currency", currency });
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d
      .toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return iso || "—";
  }
}

const clamp2 = (x: number) => Math.round(x * 100) / 100;

/** ✅ Toujours un objet plat de string → string (HeadersInit valide) */
function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ======================= Component ======================= */

export default function WithdrawTab({
  availableBalance = undefined,
}: {
  availableBalance?: number | undefined;
}) {
  const [balance, setBalance] = useState<SellerBalancePayload | null>(
    availableBalance == null
      ? null
      : { available: availableBalance, pending: 0, currency: "USD" }
  );
  const [history, setHistory] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<WithdrawMethod>("bank");
  const [recipient, setRecipient] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | {
    id: string;
    amount: number;
    ref?: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const currency: string = balance?.currency || "USD";
  const minAmount: number = balance?.limits?.min ?? 10;
  const maxPerOperation: number | undefined = balance?.limits?.max;

  /* ------------------- Fetchers ------------------- */

  async function fetchBalance() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/profile/balance`, {
        headers: authHeaders(), // ← Record<string,string>
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const json: { ok: boolean; data: SellerBalancePayload } =
        await res.json();
      setBalance(json.data);
    } catch {
      // fallback soft si l’API n’est pas dispo
      setBalance((b) => b ?? { available: 0, pending: 0, currency: "USD" });
    } finally {
      setLoading(false);
    }
  }

  // Historique → à brancher plus tard (on évite tout call pour le moment)
  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      // à brancher quand la route sera prête
      setHistory([]);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [refreshTick]);

  /* ------------------- UI computed ------------------- */

  const aNum: number = useMemo(() => clamp2(Number(amount) || 0), [amount]);
  const available: number = clamp2(balance?.available || 0);
  const pending: number = clamp2(balance?.pending || 0);

  const estFees: number = useMemo(() => {
    const f = balance?.fees;
    if (!f) return 0;
    const fix = Number(f.fixed || 0);
    const perc = Number(f.percent || 0);
    const val = clamp2(fix + (perc > 0 ? (aNum * perc) / 100 : 0));
    return val > 0 ? val : 0;
  }, [balance?.fees, aNum]);

  const willReceive: number = useMemo(
    () => Math.max(0, clamp2(aNum - estFees)),
    [aNum, estFees]
  );

  const methodIcon = (m: WithdrawMethod) =>
    m === "mobile" ? (
      <Wallet className="w-4 h-4" />
    ) : m === "bank" ? (
      <Banknote className="w-4 h-4" />
    ) : (
      <CreditCard className="w-4 h-4" />
    );

  const methodLabel = (m: WithdrawMethod) =>
    m === "mobile"
      ? "Mobile money"
      : m === "bank"
      ? "Virement bancaire (Stripe Payout)"
      : "Carte (Stripe Instant Payout)";

  const recipientLabel =
    method === "bank"
      ? "IBAN / N° de compte"
      : method === "mobile"
      ? "Numéro mobile"
      : "Email du titulaire (Stripe)";

  const recipientPlaceholder =
    method === "bank"
      ? "FR76 3000 6000 0112 3456 7890 189"
      : method === "mobile"
      ? "Ex: +225 0700000000"
      : "email@example.com";

  // Validation UI (serveur refait les contrôles)
  const maxOpForChecks =
    typeof maxPerOperation === "number" ? maxPerOperation : Infinity;

  const canSubmit =
    !submitting &&
    withdrawalsEnabled && // 🔒 si off → jamais soumettable
    aNum >= minAmount &&
    aNum <= available &&
    aNum <= maxOpForChecks &&
    recipient.trim().length >= (method === "bank" ? 10 : 6);

  function setMax() {
    if (!available) return;
    const maxOp =
      typeof maxPerOperation === "number" ? maxPerOperation : available;
    const cap = Math.min(available, maxOp);
    setAmount(String(cap.toFixed(2)));
  }

  /* ------------------- Submit ------------------- */

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!withdrawalsEnabled) return; // sécurité
    setError(null);
    setSuccess(null);

    if (aNum < minAmount) {
      setError(`Montant minimum: ${fmtMoney(minAmount, currency)}`);
      return;
    }
    if (aNum > available) {
      setError("Le montant demandé dépasse le solde disponible.");
      return;
    }
    if (typeof maxPerOperation === "number" && aNum > maxPerOperation) {
      setError(
        `La limite par opération est ${fmtMoney(maxPerOperation, currency)}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const body: CreateWithdrawalBody = {
        amount: aNum,
        method,
        recipient: recipient.trim(),
        note: note.trim() || undefined,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...authHeaders(),
      };
      const res = await fetch(`${API_BASE}/marketplace/profile/withdrawals`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const json: { ok: boolean; data: CreateWithdrawalResponse } =
        await res.json();

      setSuccess({
        id: json.data.id,
        amount: json.data.amount,
        ref: json.data.reference,
      });

      if (typeof json.data.availableBalance === "number") {
        const nb = clamp2(json.data.availableBalance);
        setBalance((b) =>
          b ? { ...b, available: nb } : { available: nb, pending: 0, currency }
        );
      } else {
        setRefreshTick((t) => t + 1);
      }

      setAmount("");
      setNote("");
    } catch {
      setError(
        "Échec de la demande de retrait. Vérifie tes infos ou réessaie."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ======================= Render ======================= */

  return (
    <div className="w-full max-w-[1200px] mx-auto overflow-x-clip">
      {/* Titre + action */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Retrait</h2>
        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          title="Rafraîchir"
        >
          <RefreshCcw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* 🔔 Bandeau d'indisponibilité */}
      {!withdrawalsEnabled && (
        <div className="mb-5 rounded-2xl ring-1 ring-amber-400/40 bg-amber-50/80 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3 text-sm">
            <ShieldAlert className="w-5 h-5 mt-0.5 text-amber-600 dark:text-amber-300" />
            <div>
              <b>En cours de développement — retraits indisponibles</b>
              <div className="opacity-80 mt-0.5">
                Pour le moment, aucun retrait n’est possible. L’interface
                ci-dessous est <i>indicative</i> et restera désactivée jusqu’à
                l’ouverture officielle.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résumé solde + mini rappel */}
      <section className="grid grid-cols-12 gap-4 mb-5">
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-5">
            <div className="text-sm opacity-70">Solde disponible</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-base">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                </span>
              ) : (
                fmtMoney(available, currency)
              )}
            </div>
            <div className="mt-2 text-xs opacity-70">
              En attente : <b>{fmtMoney(pending, currency)}</b>
            </div>
            <div className="mt-3 text-xs opacity-70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>
                Le montant demandé ne peut jamais dépasser le solde disponible.
              </span>
            </div>
            <div className="mt-2 text-xs opacity-70">
              Minimum : <b>{fmtMoney(minAmount, currency)}</b>
              {maxPerOperation != null && (
                <>
                  {" · "}Limite par opération :{" "}
                  <b>{fmtMoney(maxPerOperation, currency)}</b>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-5 h-full">
            <div className="text-sm font-medium">Conseil</div>
            <p className="mt-1 text-sm opacity-80">
              Les montants et frais affichés sont estimatifs. Les vérifications
              de sécurité (plafonds, identité du bénéficiaire, conformité) sont
              effectuées côté serveur.
            </p>
          </div>
        </div>

        {error && (
          <div className="col-span-12">
            <div className="rounded-2xl ring-1 ring-red-300/50 bg-red-50/70 dark:bg-red-900/30 p-4 text-sm">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="col-span-12">
            <div className="rounded-2xl ring-1 ring-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-900/30 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 mt-0.5" />
              <div className="text-sm">
                Requête envoyée pour <b>{fmtMoney(success.amount, currency)}</b>
                .
                {success.ref && (
                  <>
                    {" "}
                    Référence :{" "}
                    <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {success.ref}
                    </code>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Formulaire (désactivé si feature off) */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-5"
      >
        <fieldset
          disabled={!withdrawalsEnabled}
          className="space-y-4 disabled:opacity-60"
        >
          <div className="grid grid-cols-12 gap-3">
            {/* Montant */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <label className="block text-xs font-medium opacity-70 mb-1">
                Montant ({currency})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={minAmount}
                  step="0.01"
                  value={amount}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                    setAmount(ev.target.value)
                  }
                  placeholder={`≥ ${minAmount}`}
                  className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 px-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={setMax}
                  className="h-11 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  title="Tout retirer"
                >
                  Max
                </button>
              </div>
              <div className="mt-1 text-[11px] opacity-70">
                Max disponible {fmtMoney(available, currency)}
                {maxPerOperation != null &&
                  ` · Limite op. ${fmtMoney(maxPerOperation, currency)}`}
              </div>
            </div>

            {/* Méthode */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <label className="block text-xs font-medium opacity-70 mb-1">
                Méthode
              </label>
              <div className="relative">
                <select
                  value={method}
                  onChange={(ev: React.ChangeEvent<HTMLSelectElement>) =>
                    setMethod(ev.target.value as WithdrawMethod)
                  }
                  className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 pl-3 pr-10 text-sm"
                >
                  <option value="bank">Virement bancaire (Stripe)</option>
                  <option value="card">Carte (Instant Payout Stripe)</option>
                  <option value="mobile">Mobile money (si activé)</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
                  {methodIcon(method)}
                </span>
              </div>
            </div>

            {/* Destinataire */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <label className="block text-xs font-medium opacity-70 mb-1">
                {recipientLabel}
              </label>
              <input
                value={recipient}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                  setRecipient(ev.target.value)
                }
                placeholder={recipientPlaceholder}
                className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 px-3 text-sm outline-none"
              />
              <div className="mt-1 text-[11px] opacity-70">
                Méthode : {methodLabel(method)}
              </div>
            </div>

            {/* Note */}
            <div className="col-span-12">
              <label className="block text-xs font-medium opacity-70 mb-1">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(ev: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNote(ev.target.value)
                }
                rows={3}
                placeholder="Informations pour l’équipe finance (facultatif)…"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Estimation & bouton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs opacity-70">
              {estFees > 0 ? (
                <>
                  Frais estimés : <b>{fmtMoney(estFees, currency)}</b> · Vous
                  recevrez environ <b>{fmtMoney(willReceive, currency)}</b>
                </>
              ) : (
                "Aucun frais estimé (affichage indicatif)."
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold transition
                ${
                  canSubmit
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-neutral-300 text-neutral-600 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-400"
                }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {withdrawalsEnabled ? "Demander le retrait" : "Indisponible"}
            </button>
          </div>
        </fieldset>
      </form>

      {/* Historique */}
      <section className="mt-6">
        <h3 className="text-base font-semibold mb-3">
          Historique des retraits
        </h3>
        {loadingHistory ? (
          <div className="text-sm opacity-70 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : history.length === 0 ? (
          <div className="text-sm opacity-70">
            Aucun retrait pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {history.map((w) => (
              <article
                key={w.id}
                className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-neutral-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {fmtMoney(w.amount, w.currency)}
                  </div>
                  <div
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      w.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                        : w.status === "pending" || w.status === "processing"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        : "bg-red-500/10 text-red-600 dark:text-red-300"
                    }`}
                  >
                    {w.status === "paid"
                      ? "Payé"
                      : w.status === "processing"
                      ? "Traitement"
                      : w.status === "pending"
                      ? "En attente"
                      : w.status === "canceled"
                      ? "Annulé"
                      : "Refusé"}
                  </div>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {fmtDate(w.createdAt)}
                </div>
                <div className="mt-2 text-sm flex items-center gap-2 opacity-80">
                  {methodIcon(w.method)}
                  <span>
                    {w.method === "bank"
                      ? "Virement bancaire"
                      : w.method === "card"
                      ? "Carte (instant)"
                      : "Mobile money"}
                  </span>
                </div>
                {w.reference && (
                  <div className="mt-1 text-xs opacity-70">
                    Réf. :{" "}
                    <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {w.reference}
                    </code>
                  </div>
                )}
                {w.note && (
                  <div className="mt-2 text-xs opacity-70">Note: {w.note}</div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
