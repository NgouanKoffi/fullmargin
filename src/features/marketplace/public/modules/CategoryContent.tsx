// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\CategoryContent.tsx
import type { CategoryKey } from "../types";
import ShopTabs from "./ShopTabs";
import ProductsGrid from "./ProductsGrid";

export default function CategoryContent({
  category,
}: {
  category: CategoryKey;
}) {
  if (category === "boutiques") {
    return <ShopTabs />;
  }

  if (category === "all") {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Tous les produits</h3>
        <ProductsGrid />
      </div>
    );
  }

  if (category === "featured") {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
          <span>Produits certifiés</span>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-500/30">
            Certifié
          </span>
        </h3>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-900/20 backdrop-blur-xl p-5 sm:p-6 mb-8 shadow-sm">
          {/* Stronger background glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/30 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <p className="text-sm sm:text-base text-emerald-900 dark:text-emerald-100 leading-relaxed max-w-3xl">
                Produits certifiés par <span className="font-bold text-emerald-700 dark:text-emerald-400">FullMargin</span>, incluant des solutions développées et validées par notre équipe pour garantir fiabilité et performance.
              </p>
              
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                <li className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  Vérifiés par notre équipe
                </li>
                <li className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  Testés en conditions réelles
                </li>
                <li className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  Recommandés pour leur performance
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* --- CHANGEMENT ICI : Nouvelle prop certifiedOnly --- */}
        <ProductsGrid certifiedOnly />
      </div>
    );
  }

  // sinon, catégorie spécifique
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">
        Produits — <span className="opacity-70">{category}</span>
      </h3>
      <ProductsGrid categoryKey={category} />
    </div>
  );
}
