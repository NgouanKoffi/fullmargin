// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\index.tsx
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ComponentType,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTabMeta } from "./tabs";
import { useShopStatus } from "./lib/useShopStatus";
import MenuSheet from "../shared/MenuSheet";
import { ChevronsUpDown } from "lucide-react";
import MarketSideNav from "./components/MarketSideNav";
import { useAuth } from "../../auth/AuthContext"; // ⬅️ lier AuthContext

const LS_KEY = "fm:market:lastTab";

/** Sauvegarde locale sûre (évite les erreurs no-empty sur catch) */
function safeSetLS(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("localStorage.setItem failed", { key, err });
    }
    return false;
  }
}

/** Hook media query simple (ex: "(min-width: 768px)") */
function useMediaQuery(query: string) {
  const [match, setMatch] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatch(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return match;
}

export default function Marketplace() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { hasShop, loading } = useShopStatus();

  // 🔗 AuthContext binding: abonne la page à l’état d’auth & aux watchers d’inactivité
  const { status } = useAuth();
  useEffect(() => {
    // no-op: garder la souscription active (utile pour l’inactivité/présence)
    void status;
  }, [status]);

  // URL d'abord, sinon LS, sinon 'dashboard'
  const urlTab = params.get("tab");
  const requestedStr: string = (urlTab ||
    localStorage.getItem(LS_KEY) ||
    "dashboard") as string;

  // Tab meta (comp + si require shop)
  const meta = useMemo(() => getTabMeta(requestedStr), [requestedStr]);
  const TabComponent: ComponentType = meta.comp;

  // Sync URL ←→ LS (URL = source de vérité ; LS écrit après)
  useEffect(() => {
    if (urlTab) {
      safeSetLS(LS_KEY, urlTab);
    }
  }, [urlTab]);

  // Ne pas conserver d'autres query params parasites
  const go = useCallback(
    (nextTab: string) => {
      const next = new URLSearchParams();
      next.set("tab", nextTab);
      navigate({ search: `?${next.toString()}` });
      safeSetLS(LS_KEY, nextTab);
    },
    [navigate]
  );

  const currentLabel = useMemo(() => {
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      cart: "Panier",
      wishlist: "Liste d’envies",
      orders: "Mes achats",
      shop: loading
        ? "Ma boutique"
        : hasShop
        ? "Ma boutique"
        : "Créer ma boutique",
      products: "Produits",
      ventes: "Ventes",
      withdraw: "Retrait", // ⬅️ AJOUT
    };
    return map[String(requestedStr)] ?? "Dashboard";
  }, [requestedStr, hasShop, loading]);

  const [menuOpen, setMenuOpen] = useState(false);

  // Garde de contenu (PAS de navigation)
  const requiresShop = meta.requiresShop === true;
  const mustGuard = !loading && requiresShop && !hasShop;

  // ✅ n’afficher MenuSheet qu’à partir de 768px
  const isMdUp = useMediaQuery("(max-width: 768px)");

  return (
    <div className="w-full px-3 sm:px-4 lg:px-8 py-6 lg:py-8">
      {/* Mobile title button */}
      <div className="md:hidden mb-4">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="w-full inline-flex items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm
                     dark:bg-neutral-900 dark:text-neutral-100 dark:border-white/10"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="market-menu-sheet"
          title="Changer de page"
        >
          <span className="font-medium">{currentLabel}</span>
          <ChevronsUpDown className="w-4 h-4 opacity-70" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <MarketSideNav
          current={String(requestedStr)}
          hasShop={!!hasShop}
          loading={loading}
          onGo={go}
        />

        <main>
          {mustGuard ? (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
              <div className="text-sm">
                Cet onglet nécessite une boutique.{" "}
                <button
                  type="button"
                  onClick={() => go("shop")}
                  className="underline font-medium"
                >
                  Créer ma boutique
                </button>
                .
              </div>
            </div>
          ) : (
            // 🔑 Remount garanti à chaque changement d’onglet
            <TabComponent key={requestedStr} />
          )}
        </main>
      </div>

      {/* ⬇️ Rendu conditionnel: visible seulement ≥ 768px */}
      {isMdUp && (
        <MenuSheet
          kind="market"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
