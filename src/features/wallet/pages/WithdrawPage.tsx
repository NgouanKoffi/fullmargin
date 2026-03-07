// src/pages/wallet/WithdrawPage.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCcw,
  Store,
  Users,
  Wallet,
  Link2,
  History,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

import { money } from "../utils";
import { BalanceCard } from "../components/common/BalanceCard";
import { WithdrawHistory } from "../components/request/WithdrawHistory";

import { useWithdrawForm, MIN_WITHDRAW_AMOUNT } from "../hooks/useWithdrawForm";
import { WithdrawCalculation } from "../components/request/WithdrawCalculation";
import { WithdrawPaymentForm } from "../components/request/WithdrawPaymentForm";

export default function WithdrawPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"request" | "history">("request");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "history") {
      setActiveTab("history");
    }
  }, [location.search]);

  const {
    loading,
    balanceError,
    currency,
    marketplace,
    community,
    affiliation,
    total,
    calculation,
    canWithdraw,
    method,
    setMethod,
    formData,
    handleChange,
    submitError,
    handleSubmit,
    submitting,
    submitSuccess,
    historyKey,
  } = useWithdrawForm();

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
              <WithdrawCalculation
                total={total}
                currency={currency}
                taxableAmount={calculation.taxableAmount}
                fees={calculation.fees}
                affiliation={affiliation}
                net={calculation.net}
              />
            </div>
            <div className="lg:col-span-2">
              <WithdrawPaymentForm
                method={method}
                setMethod={setMethod}
                formData={formData}
                handleChange={handleChange}
                canWithdraw={canWithdraw}
                submitting={submitting}
                submitSuccess={submitSuccess}
                onSubmit={() => handleSubmit(() => setActiveTab("history"))}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && <WithdrawHistory refreshKey={historyKey} />}
    </div>
  );
}
