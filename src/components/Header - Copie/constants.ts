// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\constants.ts
import type { Group } from "./types";

export const BREAKPOINT = 1170;
export const BOTTOM_H = 76;

/** NB: l'affichage conditionnel (auth / hasShop) est géré dans DesktopNav */
export const NAV: Group[] = [
  { key: "accueil", label: "Accueil", href: "/" },
  { key: "apropos", label: "À propos", href: "/a-propos" },
  { key: "tarifs", label: "Tarifs", href: "/tarifs" },
  { key: "faq", label: "FAQ", href: "/faq" }, // 👈 ajout

  // 🛍️ Boutiques (dropdown)
  {
    key: "boutiques",
    label: "Boutiques",
    href: "/marketplace",
    items: [
      { label: "FM marketplace", href: "/marketplace" },
      { label: "Ma boutique", href: "/marketplace/dashboard?tab=shop" }, // visible si hasShop
      { label: "Mes achats", href: "/marketplace/dashboard?tab=orders" }, // auth
      { label: "Ventes", href: "/marketplace/dashboard?tab=sales" }, // visible si hasShop
      { label: "Panier", href: "/marketplace/dashboard?tab=cart" }, // auth
      { label: "Favoris", href: "/marketplace/dashboard?tab=wishlist" }, // auth
    ],
  },

  // 👥 Communautés (dropdown)
  {
    key: "communautes",
    label: "Communautés",
    href: "/communaute", // ✅ liste publique
    items: [
      { label: "Fil d’actualités", href: "/communaute" }, // ✅ liste
      { label: "Mon espace", href: "/communaute/mon-espace" }, // ✅ résout le slug du propriétaire
    ],
  },
];
