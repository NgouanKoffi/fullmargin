// src/pages/pricing/usePricingPayment.ts
import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import {
  type PricingSession,
  isCheckoutResponseV1,
  isCheckoutResponseV0,
} from "./paymentTypes";
import type { FeexPayConfig } from "@shared/components/payment/PaymentMethodModal";

export type ToastTone = "info" | "success" | "error";
export type ToastState = {
  message: string;
  tone?: ToastTone;
};

export type PaymentMethod = "card" | "crypto" | "feexpay" | null;

export function usePricingPayment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [checkingAccess, setCheckingAccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethod>(null);

  const session = (loadSession?.() ?? null) as PricingSession | null;
  const token = session?.token ?? null;

  const clearToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const ensureAuthOrOpenAccount = useCallback((): boolean => {
    if (token) return true;
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from || "/tarifs");
      localStorage.setItem("fm:oauth:open", "account");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("fm:open-account"));
    return false;
  }, [token]);

  const refreshAccessStatus = useCallback(
    async (opts?: { notify?: boolean }): Promise<boolean> => {
      if (!token) {
        setAlreadySubscribed(false);
        return false;
      }
      const notify = Boolean(opts?.notify);
      setCheckingAccess(true);
      try {
        const accessResp = await fetch(
          `${API_BASE}/payments/fm-metrix/access`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const accessData = await accessResp.json().catch(() => null);
        const hasAccess =
          Boolean(accessResp.ok) &&
          Boolean(accessData?.ok) &&
          Boolean(accessData?.allowed);
        setAlreadySubscribed(hasAccess);
        if (hasAccess && notify) {
          showToast("Vous avez déjà un abonnement FM Metrix actif.", "info");
        }
        return hasAccess;
      } catch {
        return false;
      } finally {
        setCheckingAccess(false);
      }
    },
    [token, showToast],
  );

  useEffect(() => {
    if (!token) {
      setAlreadySubscribed(false);
      setCheckingAccess(false);
      return;
    }
    void refreshAccessStatus({ notify: false });
  }, [token, refreshAccessStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    if (status === "success" && sessionId && token) {
      const url = `${API_BASE}/payments/fm-metrix/confirm?session_id=${encodeURIComponent(sessionId)}`;
      fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(() => void refreshAccessStatus({ notify: false }))
        .catch((err) => console.error("[Pricing] erreur confirm:", err));
    }
  }, [token, refreshAccessStatus]);

  const handleProStripe = useCallback(async () => {
    if (isSubmitting) return;
    if (!ensureAuthOrOpenAccount()) return;
    setIsSubmitting(true);
    setLoadingMethod("card");
    try {
      const hasSub = await refreshAccessStatus({ notify: true });
      if (hasSub) return;
      const url = `${API_BASE}/payments/checkout/fm-metrix`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 2900,
          currency: "usd",
          label: "FM Metrix Pro",
        }),
      });
      const parsed: unknown = await resp.json().catch(() => null);
      let checkoutUrl: string | undefined;

      if (isCheckoutResponseV1(parsed)) checkoutUrl = parsed.data.url;
      else if (isCheckoutResponseV0(parsed)) checkoutUrl = parsed.url;

      if (resp.ok && checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      showToast("Impossible d’ouvrir Stripe. Réessayez.", "error");
    } catch {
      showToast("Erreur réseau.", "error");
    } finally {
      setIsSubmitting(false);
      setLoadingMethod(null);
    }
  }, [
    isSubmitting,
    ensureAuthOrOpenAccount,
    token,
    showToast,
    refreshAccessStatus,
  ]);

  const submitFeexPay = useCallback(async (): Promise<FeexPayConfig | void> => {
    if (isSubmitting) return;
    if (!ensureAuthOrOpenAccount()) return;

    const user = session?.user as Record<string, any>;
    const userId = user?._id || user?.id || Date.now();

    return {
      amount: 17000, // Montant test
      customId: String(userId),
      description: "Abonnement FM Metrix Pro",
      feature: "fm-metrix",
    };
  }, [isSubmitting, ensureAuthOrOpenAccount, session]);

  // ✅ NOUVEAU : Fonction plus agressive pour rediriger
  // ✅ CORRECTION : Redirige vers la page de résultat comme Stripe
  const handleFeexPaySuccess = useCallback(
    (reference: string) => {
      // 1. On ferme le modal
      setShowPaymentModal(false);
      showToast("Paiement réussi ! Redirection...", "success");

      // 2. On redirige vers la page de validation (qui s'occupera du SSO)
      setTimeout(() => {
        window.location.assign(
          `/fm-metrix/result?status=success&provider=feexpay&reference=${encodeURIComponent(
            reference,
          )}`,
        );
      }, 1000);
    },
    [showToast],
  );

  const submitCryptoPayment = useCallback(
    async (network: string) => {
      if (isSubmitting) return;
      if (!ensureAuthOrOpenAccount()) return;
      setIsSubmitting(true);
      setLoadingMethod("crypto");

      try {
        const resp = await fetch(`${API_BASE}/payments/crypto/create-intent`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            network: network,
            amount: 29,
            feature: "fm-metrix",
          }),
        });

        const data = await resp.json();

        if (!resp.ok || !data.ok) {
          throw new Error(data.message || "Erreur création commande");
        }

        const reference = data.reference;
        const phoneNumber = "33652395381";
        const email = session?.user?.email || "Mon Email";
        const message = `Bonjour,\n\nJe viens d'effectuer un paiement Crypto pour l'abonnement FM Metrix Pro.\n\n🔹 Référence : ${reference}\n🔹 Montant : 29 USDT\n🔹 Réseau : ${network}\n🔹 Compte : ${email}\n\nCi-joint la capture d'écran de la transaction 👇`;

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");

        showToast("Commande créée ! Finalise l'envoi sur WhatsApp.", "success");
        setShowPaymentModal(false);
      } catch (err) {
        console.error("Erreur submit crypto:", err);
        showToast("Impossible de créer la commande. Réessayez.", "error");
      } finally {
        setIsSubmitting(false);
        setLoadingMethod(null);
      }
    },
    [token, isSubmitting, ensureAuthOrOpenAccount, session, showToast],
  );

  const openPaymentModal = useCallback(() => {
    if (checkingAccess) return;
    if (alreadySubscribed) {
      showToast("Vous avez déjà un abonnement actif.", "info");
      return;
    }
    setShowPaymentModal(true);
  }, [checkingAccess, alreadySubscribed, showToast]);

  const closePaymentModal = () => setShowPaymentModal(false);

  return {
    isSubmitting,
    toast,
    clearToast,
    showPaymentModal,
    openPaymentModal,
    closePaymentModal,
    handleProStripe,
    submitCryptoPayment,
    submitFeexPay,
    handleFeexPaySuccess,
    alreadySubscribed,
    checkingAccess,
    loadingMethod,
  };
}
