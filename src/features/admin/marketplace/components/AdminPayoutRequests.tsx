// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\AdminPayoutRequests.tsx
import { Sparkles, Hourglass } from "lucide-react";

export default function AdminPayoutRequests({
  money,
}: {
  money: (n: number) => string;
}) {
  // éviter l’avertissement "unused var" si le parent continue de passer `money`
  void money;

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className="
          relative overflow-hidden rounded-3xl
          ring-1 ring-black/10 dark:ring-white/10
          bg-white/80 dark:bg-neutral-900/70 backdrop-blur
          p-8 md:p-10 text-center
        "
      >
        {/* halo décoratif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 100% at 0% 0%, rgba(124,58,237,.12), transparent 60%), radial-gradient(120% 100% at 100% 0%, rgba(59,130,246,.12), transparent 60%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <span
            className="
              inline-flex items-center justify-center w-14 h-14 rounded-2xl
              bg-indigo-600 text-white ring-1 ring-white/20
              shadow-lg shadow-indigo-600/30
            "
            aria-hidden
          >
            <Hourglass className="w-7 h-7" />
          </span>

          <h3 className="text-xl md:text-2xl font-semibold">
            Bientôt disponible
          </h3>
          <p className="max-w-prose text-sm md:text-base opacity-80">
            La gestion <strong>des demandes de paiement</strong> arrive très
            prochainement. Vous pourrez suivre les demandes, les{" "}
            <em>approuver</em>, les marquer comme <em>payées</em> ou les{" "}
            <em>rejeter</em> — le tout en quelques clics.
          </p>

          <div className="mt-2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70">
            <Sparkles className="w-4 h-4" />
            <span>Merci pour votre patience.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
