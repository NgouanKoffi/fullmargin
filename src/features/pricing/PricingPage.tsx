// src/pages/Pricing.tsx
import PaymentMethodModal, {
  type PaymentMethod as ModalPaymentMethod,
} from "@shared/components/payment/PaymentMethodModal";
import { usePricingPayment } from "./usePricingPayment";
import { PricingToast } from "./components/PricingToast";
import { PricingHero } from "./components/PricingHero";
import { PricingPlanStarter } from "./components/PricingPlanStarter";
import { PricingPlanPro } from "./components/PricingPlanPro";

export default function Pricing() {
  const {
    isSubmitting,
    toast,
    clearToast,

    showPaymentModal,
    openPaymentModal,
    closePaymentModal,

    handleProStripe,
    submitCryptoPayment,
    submitFeexPay,
    handleFeexPaySuccess, // ✅ On récupère bien la fonction de succès

    alreadySubscribed,
    checkingAccess,
    loadingMethod,
  } = usePricingPayment();

  const isProActive = alreadySubscribed;
  const safeLoadingMethod: ModalPaymentMethod = loadingMethod;

  const starterLabel = checkingAccess
    ? "Chargement..."
    : isProActive
      ? "Inclus avec Pro"
      : "Votre plan actuel";

  const proDisabled = isSubmitting || checkingAccess || isProActive;
  const proLabel = checkingAccess
    ? "Vérification..."
    : isProActive
      ? "Votre plan actuel"
      : isSubmitting
        ? "Vérification..."
        : "Choisir Pro";

  return (
    <div className="min-h-screen bg-skin-surface text-skin-base dark:bg-[#0f1115] dark:text-gray-100 relative">
      {/* TOAST */}
      <PricingToast toast={toast} clearToast={clearToast} />

      {/* HERO */}
      <PricingHero />

      {/* PLANS */}
      <section className="px-6 pb-20 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto md:items-start">
        {/* STARTER */}
        <PricingPlanStarter
          starterLabel={starterLabel}
          checkingAccess={checkingAccess}
          isProActive={isProActive}
        />

        {/* PRO */}
        <PricingPlanPro
          proLabel={proLabel}
          proDisabled={proDisabled}
          checkingAccess={checkingAccess}
          isProActive={isProActive}
          openPaymentModal={openPaymentModal}
        />
      </section>

      {/* MODAL DE CHOIX DU MOYEN DE PAIEMENT */}
      <PaymentMethodModal
        open={showPaymentModal}
        onClose={closePaymentModal}
        loadingMethod={safeLoadingMethod}
        disabled={checkingAccess || alreadySubscribed}
        onCard={() => void handleProStripe()}
        onFeexPay={submitFeexPay}
        // ✅ ICI ! On passe la fonction de redirection au composant enfant !
        onFeexPaySuccess={handleFeexPaySuccess}
        onSubmitCrypto={(network: any) => void submitCryptoPayment(network)}
      />
    </div>
  );
}
