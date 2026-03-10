// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\components\MarketSideNav.tsx
import { memo, type FC } from "react";
import { useNavigate } from "react-router-dom";

type NavItem = { key: string; label: string };

type Props = {
  current: string;
  hasShop: boolean;
  loading: boolean;
  onGo: (tab: string) => void;
};

const MarketSideNav: FC<Props> = ({ current, hasShop, loading, onGo }) => {
  const navigate = useNavigate();

  // Base: on n’affiche "Dashboard" que si l’utilisateur a une boutique
  const base: NavItem[] = [
    // ⬇️ Lien public FM marketplace
    { key: "fm_public", label: "FM marketplace" },
    ...(hasShop ? [{ key: "dashboard", label: "Dashboard" }] : []),
    { key: "cart", label: "Panier" },
    { key: "wishlist", label: "Liste d’envies" },
    { key: "orders", label: "Mes achats" },
    {
      key: "shop",
      label: loading
        ? "Ma boutique"
        : hasShop
        ? "Ma boutique"
        : "Créer ma boutique",
    },
  ];

  // Section pro visible uniquement si l’utilisateur a une boutique (et pas en chargement)
  const pro: NavItem[] =
    !loading && hasShop
      ? [
          { key: "products", label: "Produits" },
          { key: "ventes", label: "Ventes" },
          // { key: "withdraw", label: "Retrait" },
        ]
      : [];

  const items = [...base, ...pro];

  const SkeletonItem = () => (
    <div className="h-10 rounded-xl ring-1 ring-neutral-200 dark:ring-white/10 bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
  );

  return (
    <aside
      className="hidden md:block md:sticky md:top-24 md:self-start
                 w-64 shrink-0 rounded-2xl border border-neutral-200 p-2
                 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60
                 backdrop-blur supports-[backdrop-filter]:bg-white/60
                 dark:supports-[backdrop-filter]:bg-neutral-900/50"
      aria-label="Navigation Marketplace"
      aria-busy={loading}
    >
      <ul className="flex flex-col gap-1">
        {loading ? (
          <>
            <li className="p-0.5">
              <SkeletonItem />
            </li>
            <li className="p-0.5">
              <SkeletonItem />
            </li>
            <li className="p-0.5">
              <SkeletonItem />
            </li>
            <li className="p-0.5">
              <SkeletonItem />
            </li>
            <li className="p-0.5">
              <SkeletonItem />
            </li>
          </>
        ) : (
          items.map((it) => {
            const active = current === it.key;
            const isPublicLink = it.key === "fm_public";

            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (isPublicLink) {
                      // 🔗 Navigation SPA vers la marketplace publique
                      navigate("/marketplace?cat=all");
                    } else {
                      onGo(it.key);
                    }
                  }}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active && !isPublicLink
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-white/10 dark:hover:bg-neutral-800"
                  }`}
                  aria-current={active && !isPublicLink ? "page" : undefined}
                >
                  {it.label}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
};

export default memo(MarketSideNav);
