// src/components/payment/PaymentMethodModal.tsx
import { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  ArrowLeft,
  DollarSign,
  Smartphone,
  Bitcoin,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import { FeexPayProvider, FeexPayButton } from "@feexpay/react-sdk";
import "@feexpay/react-sdk/style.css";

import CryptoPaymentView from "./CryptoPaymentView";
import PaymentMethodRow from "./PaymentMethodRow";

import usdtBep20Qr from "@assets/payment/BEP20.png";
import usdtTrc20Qr from "@assets/payment/TRC20.png";

export type PaymentMethod = "card" | "crypto" | "feexpay" | null;

export type FeexPayConfig = {
  amount: number;
  customId: string;
  description: string;
  feature: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCard: () => void | Promise<void>;
  onFeexPay: () => Promise<FeexPayConfig | void> | FeexPayConfig | void;
  onFeexPaySuccess?: (reference: string) => void | Promise<void>;
  onSubmitCrypto: (network: string) => void | Promise<void>;
  loadingMethod?: PaymentMethod;
  disabled?: boolean;
  cryptoAvailable?: boolean;
  feexpayAvailable?: boolean;
};

const CRYPTO_OPTIONS = [
  {
    id: "bep20",
    name: "USDT",
    network: "BEP20 (BSC)",
    icon: DollarSign,
    colorClass: "text-[#F0B90B]",
    bgColorClass: "bg-[#F0B90B]/10 border-[#F0B90B]/30",
    qrImage: usdtBep20Qr,
    address: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "trc20",
    name: "USDT",
    network: "TRC20 (Tron)",
    icon: DollarSign,
    colorClass: "text-[#FF0013]",
    bgColorClass: "bg-[#FF0013]/10 border-[#FF0013]/30",
    qrImage: usdtTrc20Qr,
    address: "T1234567890abcdef1234567890abcdef12",
  },
];

const FEEXPAY_ENV = import.meta.env.VITE_FEEXPAY_ENV || "test";
const IS_LIVE = FEEXPAY_ENV === "live";
const FP_TOKEN = IS_LIVE
  ? import.meta.env.VITE_FEEXPAY_TOKEN_LIVE
  : import.meta.env.VITE_FEEXPAY_TOKEN_TEST;
const FP_SHOP_ID = IS_LIVE
  ? import.meta.env.VITE_FEEXPAY_SHOP_ID_LIVE
  : import.meta.env.VITE_FEEXPAY_SHOP_ID_TEST;
const FP_MODE = IS_LIVE ? "LIVE" : "SANDBOX";

export default function PaymentMethodModal({
  open,
  onClose,
  onCard,
  onFeexPay,
  onFeexPaySuccess,
  onSubmitCrypto,
  loadingMethod = null,
  disabled,
  cryptoAvailable = true,
  feexpayAvailable = true,
}: Props) {
  const [step, setStep] = useState<
    "method" | "crypto-select" | "crypto-display" | "feexpay-display"
  >("method");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feexpayConfig, setFeexpayConfig] = useState<FeexPayConfig | null>(
    null,
  );

  const isBusy = !!loadingMethod || !!disabled;
  const canClose = !isBusy;

  useEffect(() => {
    if (open) {
      setStep("method");
      setSelectedCoinId(null);
      setCopied(false);
      setFeexpayConfig(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, canClose, onClose]);

  if (!open) return null;

  const activeCoin = CRYPTO_OPTIONS.find((c) => c.id === selectedCoinId);

  const handleClickCard = () => {
    if (!isBusy) onCard();
  };

  const handleClickFeexPay = async () => {
    if (isBusy) return;
    const config = await onFeexPay();
    if (config) {
      setFeexpayConfig(config);
      setStep("feexpay-display");
    }
  };

  const handleClickCrypto = () => {
    if (!isBusy && cryptoAvailable) setStep("crypto-select");
  };

  const handleSelectCoin = (id: string) => {
    setSelectedCoinId(id);
    setStep("crypto-display");
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all"
      onClick={(e) => e.target === e.currentTarget && canClose && onClose()}
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-slate-950 sm:bg-slate-950/95 border-0 sm:border border-slate-700/80 shadow-2xl p-6 overflow-y-auto sm:overflow-visible">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 sm:mb-5 pt-2 sm:pt-0">
          <div className="flex items-center gap-2">
            {step !== "method" && (
              <button
                onClick={() =>
                  setStep(
                    step === "crypto-display" ? "crypto-select" : "method",
                  )
                }
                className="p-1 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-lg font-bold text-slate-50 leading-tight">
                {step === "method" && "Moyen de paiement"}
                {step === "crypto-select" && "Choisir le réseau"}
                {step === "crypto-display" && "Payer en USDT"}
                {step === "feexpay-display" && "Mobile Money"}
              </h2>
            </div>
          </div>

          <button
            onClick={() => canClose && onClose()}
            className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            disabled={!canClose}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="min-h-[180px]">
          {step === "method" && (
            <div className="space-y-4 sm:space-y-3 animation-fade-in">
              <PaymentMethodRow
                icon={CreditCard}
                title="Carte Bancaire"
                subtitle="Visa, Mastercard (Stripe)"
                onClick={handleClickCard}
                isLoading={loadingMethod === "card"}
                disabled={isBusy}
                theme="indigo"
              />

              {feexpayAvailable && (
                <PaymentMethodRow
                  icon={Smartphone}
                  title="Mobile Money"
                  subtitle="Orange, MTN, Moov, Wave"
                  onClick={handleClickFeexPay}
                  isLoading={loadingMethod === "feexpay"}
                  disabled={isBusy}
                  theme="emerald"
                />
              )}

              {cryptoAvailable && (
                <PaymentMethodRow
                  icon={Bitcoin}
                  title="Crypto-monnaie"
                  subtitle="USDT (Tether)"
                  onClick={handleClickCrypto}
                  isLoading={loadingMethod === "crypto"}
                  disabled={isBusy}
                  theme="amber"
                />
              )}
            </div>
          )}

          {step === "feexpay-display" && feexpayConfig && (
            <div className="flex flex-col items-center justify-center space-y-5 animation-fade-in py-2">
              <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mb-2 flex gap-3">
                <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                <div className="text-xs sm:text-[13px] leading-relaxed">
                  <p className="text-rose-500 font-black uppercase mb-1">
                    🔴 Action requise durant le paiement
                  </p>
                  <p className="text-slate-200">
                    Une fois le bouton ci-dessous cliqué,{" "}
                    <strong>ne fermez plus cette fenêtre</strong> et
                    n'actualisez pas la page.
                  </p>
                  <p className="text-slate-400 mt-2 italic">
                    Attendez la redirection automatique après validation. Fermer
                    prématurément risque de bloquer la livraison de votre
                    commande.
                  </p>
                </div>
              </div>

              {/* ✅ CORRECTION : Isolation totale du SDK du mode sombre. On force le texte en noir (text-slate-900) */}
              <div
                className="w-full bg-white text-slate-900 rounded-xl p-2 overflow-hidden"
                style={{ colorScheme: "light" }}
              >
                <FeexPayProvider>
                  <FeexPayButton
                    amount={feexpayConfig.amount}
                    description={feexpayConfig.description}
                    token={FP_TOKEN || ""}
                    id={FP_SHOP_ID || ""}
                    customId={feexpayConfig.customId}
                    mode={FP_MODE}
                    callback_info={{
                      feature: feexpayConfig.feature,
                      userId: feexpayConfig.customId,
                    }}
                    callback={async (response: any) => {
                      const isSuccess =
                        String(response.status).toUpperCase() ===
                          "SUCCESSFUL" ||
                        String(response.status).toUpperCase() === "SUCCESS";

                      if (isSuccess) {
                        if (onFeexPaySuccess) {
                          await onFeexPaySuccess(
                            response.reference || "feexpay_ref_missing",
                          );
                        } else {
                          window.location.reload();
                        }
                      } else {
                        alert("Le paiement a été interrompu ou a échoué.");
                      }
                    }}
                    buttonText="Payer avec FeexPay"
                    buttonClass="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl transition shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                    currency="XOF"
                  />
                </FeexPayProvider>
              </div>

              <p className="text-[11px] text-slate-500 text-center uppercase tracking-widest font-semibold mt-2">
                Paiement local sécurisé
              </p>
            </div>
          )}

          {step === "crypto-select" && (
            <div className="space-y-4 sm:space-y-3 animation-fade-in">
              <p className="text-base sm:text-sm text-slate-400 mb-2">
                Sélectionne le réseau :
              </p>
              {CRYPTO_OPTIONS.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleSelectCoin(coin.id)}
                  className="w-full group flex items-center justify-between rounded-xl px-4 py-4 sm:py-3 text-left border bg-slate-900/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition ${coin.bgColorClass}`}
                    >
                      <coin.icon
                        className={`h-6 w-6 sm:h-5 sm:w-5 ${coin.colorClass}`}
                      />
                    </div>
                    <div>
                      <span className="block text-base sm:text-sm font-bold text-slate-100">
                        {coin.name}
                      </span>
                      <span
                        className={`block text-sm sm:text-xs font-medium ${coin.colorClass}`}
                      >
                        {coin.network}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 text-slate-600 group-hover:text-white transition" />
                </button>
              ))}
            </div>
          )}

          {step === "crypto-display" && activeCoin && (
            <CryptoPaymentView
              coin={activeCoin}
              copied={copied}
              onCopy={handleCopyAddress}
              onSubmit={() => void onSubmitCrypto(activeCoin.network)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
