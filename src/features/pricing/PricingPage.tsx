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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-[#06080A] dark:to-black transition-colors duration-500 text-slate-900 dark:text-white relative overflow-hidden">
      {/* Subtle Grid Background replacing orbs for tech feel */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[size:32px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10 w-full h-full pt-10">
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
    </div>
  );
}
