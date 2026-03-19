// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\navConfig.ts
import { type ReactNode } from "react";

export type AuthStatus = "authenticated" | "anonymous" | "loading";

/**
 * Compteurs spécifiques à la partie communauté
 */
export type CommunityCounts = {
  ownerPending?: number;
  myPending?: number;
  reviewUnseen?: number;
  /** 👇 nouveau : nombre de notifs de communauté non lues */
  notifications?: number;
};

export type HeaderNavItem = {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: number;
  /** item visible seulement si user est connecté (pour filtrage éventuel) */
  requiresAuth?: boolean;
  /** item visible seulement si user a une boutique */
  requiresShop?: boolean;
};

export type HeaderNavGroup = {
  key: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  items?: HeaderNavItem[];
  /** badge sur le GROUPE (ex: “Communautés”) */
  badge?: number;
  /** 👇 nouveau : item spécial mis en évidence (scintillant) */
  isSpecial?: boolean;
};

export function buildHeaderNav({
  authStatus,
  hasShop,
  myCommunitySlug,
}: {
  authStatus: AuthStatus;
  hasShop: boolean;
  myCommunitySlug?: string;
  // ❌ communityCounts retiré - plus de badges dans les menus
}): HeaderNavGroup[] {
  const isAuthed = authStatus === "authenticated";

  // ❌ Plus de badge sur les menus - uniquement sur la cloche et les messages
  // const totalCommunityBadge = ...

  const hasCommunity = Boolean(myCommunitySlug);

  const myCommunityHref = hasCommunity
    ? `/communaute/${myCommunitySlug}`
    : "/communaute/mon-espace";

  const groups: HeaderNavGroup[] = [
    { key: "accueil", label: "Accueil", href: "/" },
    { key: "apropos", label: "À propos", href: "/a-propos" },
    { key: "tarifs", label: "Tarifs", href: "/tarifs" },
    // { key: "faq", label: "FAQ", href: "/faq" },

    // 🆕 Mes outils (dropdown protégé par auth)
    {
      key: "mes-outils",
      label: "Mes outils",
      items: [
        { key: "tools-notes", label: "Mes notes", href: "/notes" },
        { key: "tools-tasks", label: "Tâches & projets", href: "/projets" },
        { key: "tools-finances", label: "Finance", href: "/finance" },
        { key: "tools-journal", label: "Journal de trading", href: "/journal" },
        // { key: "tools-live", label: "Lancer un live", href: "https://live.fullmargin.net/" },
        { key: "tools-podcasts", label: "Podcasts", href: "/podcasts" },
      ],
    },

    // 🆕 Lien FullMetrix scintillant mis en évidence
    {
      key: "fullmetrix",
      label: "FullMetrix",
      href: "/fm-metrix/a-propos",
      isSpecial: true,
    },

    {
      key: "boutiques",
      label: "Boutiques",
      href: "/marketplace",
      items: [
        {
          key: "market-home",
          label: "FM marketplace",
          href: "/marketplace",
        },
        {
          key: "market-dashboard",
          label: "Dashboard",
          href: "/marketplace/dashboard?tab=dashboard",
          requiresAuth: true,
        },
        {
          key: "market-orders",
          label: "Mes achats",
          href: "/marketplace/dashboard?tab=orders",
          requiresAuth: true,
        },
        {
          key: "market-cart",
          label: "Panier",
          href: "/marketplace/dashboard?tab=cart",
          requiresAuth: true,
        },
        {
          key: "market-wishlist",
          label: "Favoris",
          href: "/marketplace/dashboard?tab=wishlist",
          requiresAuth: true,
        },
        {
          key: "market-shop",
          label: hasShop ? "Ma boutique" : "Créer ma boutique",
          href: "/marketplace/dashboard?tab=shop",
          requiresAuth: true,
        },
        {
          key: "market-sales",
          label: "Ventes",
          href: "/marketplace/dashboard?tab=sales",
          requiresAuth: true,
          requiresShop: true,
        },
      ],
    },

    {
      key: "communautes",
      label: "Communautés",
      href: "/communaute",
      // ❌ Plus de badge - seulement dans la cloche
      items: [
        {
          key: "community-feed",
          label: "Fil d’actualités",
          href: "/communaute?tab=feed",
        },
        {
          key: "community-list",
          label: "Communautés",
          href: "/communaute?tab=communautes",
        },
        {
          key: "community-formations",
          label: "Formations",
          href: "/communaute?tab=formations",
        },
        {
          key: "community-groupes",
          label: "Groupes",
          href: "/communaute?tab=groupes",
        },
        {
          key: "community-direct",
          label: "Lives & directs",
          href: "/communaute?tab=direct",
        },
        {
          key: "community-mine",
          // 👉 dynamique : avant création vs après
          label: hasCommunity ? "Mon espace" : "Créer ma communauté",
          href: myCommunityHref, // slug perso ou /communaute/mon-espace
          requiresAuth: true,
          // ❌ Plus de badge ici non plus
        },
      ],
    },
  ];

  // filtrage auth / shop (⚠️ Mes outils n’a PAS requiresAuth donc reste visible)
  const filtered = groups.map((g) => {
    if (!g.items) return g;

    const nextItems: HeaderNavItem[] = g.items.filter((it) => {
      if (it.requiresAuth && !isAuthed) return false;
      if (it.requiresShop && !hasShop) return false;
      return true;
    });

    return {
      ...g,
      items: nextItems,
    };
  });

  return filtered;
}
