import { useState, useMemo } from "react";
import { api } from "@core/api/client";
import { useSellerBalance } from "@features/marketplace/lib/useSellerBalance";

export const MIN_WITHDRAW_AMOUNT = 100;
export const FEE_RATE = 0.09;

export function useWithdrawForm() {
  const { loading, error: balanceError, bal } = useSellerBalance();
  const currency = (bal?.currency || "USD").toUpperCase();

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
    : bal?.available ?? 0;
  const community = overrideBalances
    ? overrideBalances.community
    : bal?.community ?? 0;
  const affiliation = overrideBalances
    ? overrideBalances.affiliation
    : bal?.affiliation ?? 0;

  const total = useMemo(
    () => marketplace + community + affiliation,
    [marketplace, community, affiliation]
  );

  const calculation = useMemo(() => {
    const taxableAmount = marketplace + community;
    const fees = taxableAmount * FEE_RATE;
    const net = total - fees;
    return { taxableAmount, fees, net };
  }, [marketplace, community, total]);

  const canWithdraw = total >= MIN_WITHDRAW_AMOUNT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (onSuccessCallback?: () => void) => {
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

      const payload = { method, paymentDetails };
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

      if (onSuccessCallback) {
        setTimeout(onSuccessCallback, 1500);
      }
    } catch (e: any) {
      console.error("[WITHDRAW SUBMIT ERROR]", e);
      setSubmitError(e?.message || e?.error || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
