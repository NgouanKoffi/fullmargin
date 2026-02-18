// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\shared\MenuSheet.tsx
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { buildMenu, type Kind } from "../../components/Header/menu";
import BaseSheet from "../../components/Header/sheets/BaseSheet";

type Props = {
  kind: Extract<Kind, "market" | "community">;
  open: boolean;
  onClose: () => void;
};

/* ---------- Styles ---------- */
const tileBase =
  "rounded-2xl px-4 py-3 text-sm ring-1 ring-skin-border/20 bg-[rgb(var(--tile))] text-skin-base/95";
const tileHover = "hover:bg-[rgb(var(--tile-strong))]";
const dangerTile =
  "rounded-2xl px-4 py-3 text-sm ring-1 ring-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-300";
const activeCls =
  "bg-violet-600 text-white ring-2 ring-violet-500/40 shadow-[0_0_0_3px_rgba(109,40,217,.25)]";

/* ---------- Helpers ---------- */
const normalizePath = (p: string) => (p || "/").replace(/\/+$/, "");

/* strict: path égal + query égal si la cible en a une */
const isHrefStrictActive = (
  pathname: string,
  search: string,
  href?: string
): boolean => {
  if (!href) return false;
  const [tgtPathRaw, tgtSearchRaw] = href.split("?");
  const tgtPath = normalizePath(tgtPathRaw || "/");
  const curPath = normalizePath(pathname);
  if (curPath !== tgtPath) return false;
  if (!tgtSearchRaw || tgtSearchRaw.trim() === "") return true;
  const tgtSearch = `?${tgtSearchRaw}`;
  return search === tgtSearch;
};

/** Lit le flag local "ai-je une boutique ?" (déposé par le front) */
function hasShopNow(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}

/* Masquer toute entrée “déconnexion” (clé/label/variant) */
function filterOutLogout<
  T extends { key?: string; label?: string; variant?: string }
>(items: T[]): T[] {
  const bannedKeys = new Set(["logout", "signout", "sign-out"]);
  return items.filter((i) => {
    const k = (i.key || "").toLowerCase();
    const l = (i.label || "").toLowerCase();
    if (i.variant === "danger") return false;
    if (bannedKeys.has(k)) return false;
    if (
      /dé?connexion|logout|sign[\s-]?out|se\s*deconnecter|se\s*déconnecter/.test(
        l
      )
    )
      return false;
    return true;
  });
}

export default function MenuSheet({ kind, open, onClose }: Props) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isGuest = status !== "authenticated";

  const { pathname, search } = useLocation();

  const isMarket = kind === "market";
  const dashboardPath = isMarket
    ? "/marketplace/dashboard"
    : "/communautes/dashboard";

  const onPrivateDashboard =
    pathname === dashboardPath || pathname.startsWith(dashboardPath);

  const currentTab = onPrivateDashboard
    ? new URLSearchParams(search).get("tab") ||
      (isMarket ? "dashboard" : "feed")
    : null;

  const getTabFromHref = (href: string) => {
    const q = href.split("?")[1] || "";
    const tab = new URLSearchParams(q).get("tab");
    if (tab) return tab;
    if (href.endsWith("/dashboard")) return isMarket ? "dashboard" : "feed";
    return null;
  };

  const title = isMarket ? "Marketplace" : "Communauté";
  const labelledById = isMarket
    ? "market-menu-sheet-title"
    : "community-menu-sheet-title";

  // ⚙️ Construire le menu de base (sans les entrées "déconnexion")
  const rawItems = filterOutLogout(
    buildMenu(kind, { status, roles }) as Array<{
      key?: string;
      label: string;
      href?: string;
      icon?: React.ReactNode;
      variant?: string;
      onClick?: () => void;
    }>
  );

  // ✅ Règle demandée: si MARKET et PAS de boutique → masquer UNIQUEMENT “Dashboard”
  // On NE supprime que l’entrée dont le label est "Dashboard" OU dont le href est EXACTEMENT "/marketplace/dashboard".
  const items =
    isMarket && status === "authenticated" && !hasShopNow()
      ? rawItems.filter(
          (i) =>
            i.label !== "Dashboard" &&
            !(i.href && i.href === "/marketplace/dashboard")
        )
      : rawItems;

  return (
    <BaseSheet
      open={open}
      onClose={onClose}
      title={title}
      labelledById={labelledById}
    >
      {isGuest ? (
        <p className="mt-2 text-sm text-skin-muted">
          Connectez-vous pour accéder à cette section.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
          {items.map((i) => {
            const base =
              i.variant === "danger" ? dangerTile : `${tileBase} ${tileHover}`;

            // Bouton sans href
            if (!i.href) {
              return (
                <button
                  key={`btn-${i.label}`}
                  type="button"
                  onClick={() => {
                    i.onClick?.();
                    onClose();
                  }}
                  className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring`}
                >
                  <div className="flex items-center gap-2">
                    {i.icon}
                    <span className="whitespace-nowrap">{i.label}</span>
                  </div>
                </button>
              );
            }

            // Externe
            if (/^https?:\/\//i.test(i.href)) {
              return (
                <a
                  key={`ext-${i.href}`}
                  href={i.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring`}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-2">
                    {i.icon}
                    <span className="whitespace-nowrap">{i.label}</span>
                  </div>
                </a>
              );
            }

            // Hash
            if (i.href.startsWith("#")) {
              return (
                <button
                  key={`hash-${i.href}`}
                  type="button"
                  className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring`}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-2">
                    {i.icon}
                    <span className="whitespace-nowrap">{i.label}</span>
                  </div>
                </button>
              );
            }

            // ===== SPA & TABS: ACTIVATION CORRECTE =====
            const href = i.href;
            const linkTab = getTabFromHref(href);

            /* Règle:
               - si le lien a un tab => actif uniquement quand currentTab === tab
               - si pas de tab:
                    • si on est sur le dashboard privé, activer uniquement pour "dashboard"/"feed"
                    • sinon, utiliser match strict (path+query) pour les pages hors dashboard
            */
            let isActive = false;

            if (linkTab) {
              isActive = onPrivateDashboard && currentTab === linkTab;
            } else if (onPrivateDashboard) {
              // lien “Dashboard” (sans ?tab)
              const dashboardTab = isMarket ? "dashboard" : "feed";
              isActive =
                currentTab === dashboardTab && href.endsWith("/dashboard");
            } else {
              isActive = isHrefStrictActive(pathname, search, href);
            }

            return (
              <NavLink
                key={`in-${href}`}
                to={href}
                className={() =>
                  [
                    "block focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring",
                    base,
                    isActive ? activeCls : "",
                  ].join(" ")
                }
                onClick={onClose}
                end={false}
              >
                <div className="flex items-center gap-2">
                  {i.icon}
                  <span className="whitespace-nowrap">{i.label}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </BaseSheet>
  );
}
