// src/pages/wallet/WithdrawPage.tsx
import { useMemo, useState } from "react";
import {
  CreditCard,
  AlertTriangle,
  RefreshCcw,
  Store,
  Users,
  Wallet,
  Link2,
  ArrowRight,
  Calculator,
  Building2,
  Bitcoin,
  History,
  PlusCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

import { useSellerBalance } from "../marketplace/lib/useSellerBalance";
import { money } from "./utils";
import { BalanceCard } from "./components/BalanceCard";
import { MethodButton } from "./components/MethodButton";
import { WithdrawHistory } from "./components/WithdrawHistory";
import { api } from "../../lib/api";

const MIN_WITHDRAW_AMOUNT = 20;
const FEE_RATE = 0.09;

export default function WithdrawPage() {
  const { loading, error: balanceError, bal } = useSellerBalance();
  const currency = (bal?.currency || "USD").toUpperCase();

  const [activeTab, setActiveTab] = useState<"request" | "history">("request");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const [method, setMethod] = useState<"USDT" | "BTC" | "BANK" | "">("");
  const [formData, setFormData] = useState({
    cryptoAddress: "",
    bankName: "",
    bankIban: "",
    bankSwift: "",
    bankCountry: "",
  });

  const [overrideBalances, setOverrideBalances] = useState<null | {
    marketplace: number;
    community: number;
    affiliation: number;
  }>(null);

  const marketplace = overrideBalances
    ? overrideBalances.marketplace
    : (bal?.available ?? 0);
  const community = overrideBalances
    ? overrideBalances.community
    : (bal?.community ?? 0);
  const affiliation = overrideBalances
    ? overrideBalances.affiliation
    : (bal?.affiliation ?? 0);

  const total = useMemo(
    () => marketplace + community + affiliation,
    [marketplace, community, affiliation],
  );

  const calculation = useMemo(() => {
    const taxableAmount = marketplace + community;
    const fees = taxableAmount * FEE_RATE;
    const net = total - fees;
    return { taxableAmount, fees, net };
  }, [marketplace, community, total]);

  const canWithdraw = total >= MIN_WITHDRAW_AMOUNT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async () => {
    // Validation locale avant envoi pour éviter le 400 inutile
    if (method === "BANK") {
      if (!formData.bankName || !formData.bankIban) {
        setSubmitError("Le nom et l'IBAN sont obligatoires pour un virement.");
        return;
      }
    } else if (!formData.cryptoAddress) {
      setSubmitError("L'adresse de réception est obligatoire.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // ✅ NETTOYAGE DU PAYLOAD : On n'envoie que ce qui est nécessaire
      const paymentDetails =
        method === "BANK"
          ? {
              bankName: formData.bankName.trim(),
              bankIban: formData.bankIban.trim(),
              bankSwift: formData.bankSwift.trim() || undefined,
              bankCountry: formData.bankCountry.trim() || undefined,
            }
          : {
              cryptoAddress: formData.cryptoAddress.trim(),
            };

      const payload = {
        method,
        paymentDetails,
      };

      await api.post("/wallet/withdrawals", payload);

      setSubmitSuccess(true);
      setFormData({
        cryptoAddress: "",
        bankName: "",
        bankIban: "",
        bankSwift: "",
        bankCountry: "",
      });
      setMethod("");
      setOverrideBalances({ marketplace: 0, community: 0, affiliation: 0 });
      setHistoryKey((k) => k + 1);

      // On bascule sur l'historique après un court délai
      setTimeout(() => setActiveTab("history"), 1500);
    } catch (e: any) {
      console.error("[WITHDRAW SUBMIT ERROR]", e);
      setSubmitError(e?.message || e?.error || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8 font-sans text-slate-900 dark:text-slate-100">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Retrait
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Gains unifiés (Marketplace + Communauté + Affiliation).
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4 text-slate-500" />
          <span>Actualiser</span>
        </button>
      </header>

      {/* Cartes des soldes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BalanceCard
          title="Marketplace"
          icon={<Store className="w-5 h-5" />}
          amount={marketplace}
          currency={currency}
          loading={loading}
        />
        <BalanceCard
          title="Communauté"
          icon={<Users className="w-5 h-5" />}
          amount={community}
          currency={currency}
          loading={loading}
        />
        <BalanceCard
          title="Affiliation"
          icon={<Link2 className="w-5 h-5" />}
          amount={affiliation}
          currency={currency}
          loading={loading}
        />
        <BalanceCard
          title="Solde Global"
          icon={<Wallet className="w-5 h-5" />}
          amount={total}
          currency={currency}
          emphasis
          loading={loading}
        />
      </section>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("request")}
            className={clsx(
              "py-4 px-1 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-colors",
              activeTab === "request"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <PlusCircle className="w-4 h-4" /> Nouvelle demande
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={clsx(
              "py-4 px-1 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-colors",
              activeTab === "history"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <History className="w-4 h-4" /> Historique
          </button>
        </nav>
      </div>

      {activeTab === "request" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(balanceError || submitError) && (
            <div className="mb-6 rounded-2xl p-4 bg-red-50 text-red-700 border border-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{String(submitError || balanceError)}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="mb-6 rounded-2xl p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                Demande de retrait envoyée avec succès. Redirection...
              </span>
            </div>
          )}

          {!loading && !canWithdraw && !submitSuccess && (
            <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 flex items-start gap-3 mb-6 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Seuil de retrait non atteint</p>
                <p className="text-sm mt-1">
                  Minimum :{" "}
                  <strong>{money(MIN_WITHDRAW_AMOUNT, currency)}</strong>.
                  Manquant : {money(MIN_WITHDRAW_AMOUNT - total, currency)}.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 p-6 sticky top-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-violet-600">
                  <Calculator className="w-5 h-5" />
                  <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
                    Détails du calcul
                  </h2>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Solde Total</span>
                    <span className="font-bold">{money(total, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Ventes (Boutique + Commu)
                    </span>
                    <span>{money(calculation.taxableAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">
                      Frais de service (9%)
                    </span>
                    <span className="text-red-500">
                      - {money(calculation.fees, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 text-xs">
                      Affiliation{" "}
                      <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[10px] ml-1">
                        0% Frais
                      </span>
                    </span>
                    <span className="text-emerald-600">
                      + {money(affiliation, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-dashed border-slate-200">
                    <span className="font-bold text-lg">Net à recevoir</span>
                    <span className="font-bold text-xl text-violet-600">
                      {money(calculation.net, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div
                className={clsx(
                  "rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 p-6 sm:p-8 shadow-sm",
                  (!canWithdraw || submitSuccess) &&
                    "opacity-50 pointer-events-none",
                )}
              >
                <div className="flex items-center gap-3 mb-8">
                  <CreditCard className="w-6 h-6 text-violet-600" />
                  <h2 className="font-semibold text-xl">Méthode de paiement</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <MethodButton
                    active={method === "USDT"}
                    onClick={() => setMethod("USDT")}
                    icon={<Bitcoin className="w-6 h-6" />}
                    label="USDT (TRC20)"
                    sub="Recommandé"
                  />
                  <MethodButton
                    active={method === "BTC"}
                    onClick={() => setMethod("BTC")}
                    icon={<Bitcoin className="w-6 h-6" />}
                    label="Bitcoin"
                    sub="Volatile"
                  />
                  <MethodButton
                    active={method === "BANK"}
                    onClick={() => setMethod("BANK")}
                    icon={<Building2 className="w-6 h-6" />}
                    label="Virement"
                    sub="2-5 jours"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 mb-8 min-h-[120px]">
                  {!method && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm py-4">
                      Sélectionnez une méthode pour continuer.
                    </div>
                  )}
                  {(method === "USDT" || method === "BTC") && (
                    <div className="animate-in fade-in duration-300">
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                        Adresse {method === "USDT" ? "TRC20" : "Bitcoin"}
                      </label>
                      <input
                        type="text"
                        name="cryptoAddress"
                        value={formData.cryptoAddress}
                        onChange={handleChange}
                        placeholder={
                          method === "USDT"
                            ? "Ex: T9yD14Nj9..."
                            : "Ex: 1A1zP1eP..."
                        }
                        className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  )}
                  {method === "BANK" && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                            Nom complet
                          </label>
                          <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="Nom Prénom"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                            Pays
                          </label>
                          <input
                            type="text"
                            name="bankCountry"
                            value={formData.bankCountry}
                            onChange={handleChange}
                            className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="Ex: France"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                          IBAN / RIB
                        </label>
                        <input
                          type="text"
                          name="bankIban"
                          value={formData.bankIban}
                          onChange={handleChange}
                          className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                          placeholder="FR76..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                          Code SWIFT (Optionnel)
                        </label>
                        <input
                          type="text"
                          name="bankSwift"
                          value={formData.bankSwift}
                          onChange={handleChange}
                          className="w-full sm:w-1/2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                          placeholder="Ex: BNPFR..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!canWithdraw || !method || submitting}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all shadow-md",
                      !canWithdraw || !method || submitting
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-violet-600 text-white hover:bg-violet-700 hover:-translate-y-0.5",
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Traitement...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5" /> Soumettre la demande
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && <WithdrawHistory refreshKey={historyKey} />}
    </div>
  );
}
