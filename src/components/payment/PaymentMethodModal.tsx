// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\payment\PaymentMethodModal.tsx
import type React from "react";
import { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Bitcoin,
  DollarSign,
} from "lucide-react";

import CryptoPaymentView from "./CryptoPaymentView";

// --- IMPORT DES IMAGES QR CODE ---
import usdtBep20Qr from "../../assets/payment/BEP20.png";
import usdtTrc20Qr from "../../assets/payment/TRC20.png";

export type PaymentMethod = "card" | "crypto" | null;

type Props = {
  open: boolean;
  onClose: () => void;
  onCard: () => void | Promise<void>;

  // ✅ Nouvelle prop pour gérer la soumission crypto vers le parent
  onSubmitCrypto: (network: string) => void | Promise<void>;

  loadingMethod?: PaymentMethod;
  disabled?: boolean;
  cryptoAvailable?: boolean;
  cryptoMinUsd?: number;
};

// Configuration des Cryptos
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

export default function PaymentMethodModal({
  open,
  onClose,
  onCard,
  onSubmitCrypto, // ✅ On récupère la fonction ici
  loadingMethod = null,
  disabled,
  cryptoAvailable = true,
}: Props) {
  const [step, setStep] = useState<
    "method" | "crypto-select" | "crypto-display"
  >("method");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isBusy = !!loadingMethod || !!disabled;

  useEffect(() => {
    if (open) {
      setStep("method");
      setSelectedCoinId(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isBusy, onClose]);

  if (!open) return null;

  const canClose = !isBusy;

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && canClose) onClose();
  };

  const handleClickCard = () => {
    if (isBusy) return;
    void onCard();
  };

  const handleClickCrypto = () => {
    if (isBusy || !cryptoAvailable) return;
    setStep("crypto-select");
  };

  const handleSelectCoin = (id: string) => {
    setSelectedCoinId(id);
    setStep("crypto-display");
  };

  const handleBack = () => {
    if (step === "crypto-display") setStep("crypto-select");
    else if (step === "crypto-select") setStep("method");
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCoin = CRYPTO_OPTIONS.find((c) => c.id === selectedCoinId);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-slate-950 sm:bg-slate-950/95 border-0 sm:border border-slate-700/80 shadow-2xl p-6 overflow-y-auto sm:overflow-visible">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 sm:mb-5 pt-2 sm:pt-0">
          <div className="flex items-center gap-2">
            {step !== "method" && (
              <button
                onClick={handleBack}
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
              </h2>
              {step === "method" && (
                <p className="text-sm sm:text-xs text-slate-400 mt-0.5">
                  Sécurisé et rapide
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (canClose) onClose();
            }}
            className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            disabled={!canClose}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="min-h-[180px]">
          {/* VUE 1 : CHOIX CARTE / CRYPTO */}
          {step === "method" && (
            <div className="space-y-4 sm:space-y-3 animation-fade-in">
              <button
                type="button"
                onClick={handleClickCard}
                disabled={isBusy}
                className={`w-full group flex items-center justify-between rounded-xl px-4 py-4 sm:py-3 text-left border transition-all duration-200
                  ${
                    isBusy
                      ? "opacity-50 cursor-not-allowed bg-slate-900 border-slate-800"
                      : "bg-slate-900/60 border-slate-700/60 hover:bg-indigo-950/20 hover:border-indigo-500/50"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 group-hover:bg-indigo-500/20 transition">
                    <CreditCard className="h-6 w-6 sm:h-5 sm:w-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="block text-base sm:text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition">
                      Carte Bancaire
                    </span>
                    <span className="block text-sm sm:text-xs text-slate-500">
                      Visa, Mastercard
                    </span>
                  </div>
                </div>
                {loadingMethod === "card" ? (
                  <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin text-indigo-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 text-slate-600 group-hover:text-indigo-400 transition" />
                )}
              </button>

              {cryptoAvailable && (
                <button
                  type="button"
                  onClick={handleClickCrypto}
                  disabled={isBusy}
                  className={`w-full group flex items-center justify-between rounded-xl px-4 py-4 sm:py-3 text-left border transition-all duration-200
                    ${
                      isBusy
                        ? "opacity-50 cursor-not-allowed bg-slate-900 border-slate-800"
                        : "bg-slate-900/60 border-slate-700/60 hover:bg-amber-950/20 hover:border-amber-500/50"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500/20 transition">
                      <Bitcoin className="h-6 w-6 sm:h-5 sm:w-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="block text-base sm:text-sm font-semibold text-slate-100 group-hover:text-amber-200 transition">
                        Crypto-monnaie
                      </span>
                      <span className="block text-sm sm:text-xs text-slate-500">
                        USDT (Tether)
                      </span>
                    </div>
                  </div>
                  {loadingMethod === "crypto" ? (
                    <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin text-amber-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 text-slate-600 group-hover:text-amber-400 transition" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* VUE 2 : LISTE DES RESEAUX */}
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

          {/* VUE 3 : PAIEMENT */}
          {step === "crypto-display" && activeCoin && (
            <CryptoPaymentView
              coin={activeCoin}
              copied={copied}
              onCopy={handleCopyAddress}
              // ✅ ICI : On appelle la fonction passée par le parent
              onSubmit={() => {
                void onSubmitCrypto(activeCoin.network);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
