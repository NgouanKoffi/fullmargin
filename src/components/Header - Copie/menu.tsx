// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\menu.tsx
import type { ReactNode } from "react";
import {
  Cart,
  Heart,
  Package,
  Store,
  Bell,
  Note,
  Mic,
  Chart,
  Book,
} from "./icons";
import {
  Settings2,
  LogOut,
  KanbanSquare,
  Boxes,
  LayoutDashboard,
  CreditCard,
  Users,
  MessageSquareText,
} from "lucide-react";

// 👇 tes imports que tu as dit vouloir ajouter
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

export type Kind = "market" | "account" | "community";

export type MenuItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "danger" | "default";
  /** 🔒 si true on l'affiche mais on ne laisse pas cliquer */
  locked?: boolean;
};

function hasShopNow(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}

function guestItems(): MenuItem[] {
  return [];
}

// 👇 petit helper local pour FM Metrix
async function handleFMMetrixClick() {
  // côté SSR / build, on sort
  if (typeof window === "undefined") return;

  // 1. récupérer la session locale
  const session = loadSession?.();
  const token = session?.token;

  // si pas connecté (ça ne devrait pas arriver ici, mais au cas où)
  if (!token) {
    window.location.href = "/tarifs";
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/fm-metrix/access`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      window.location.href = "/tarifs";
      return;
    }

    const data = await resp.json();

    if (data?.ok && data?.allowed) {
      window.location.href = `${API_BASE}/auth/sso/fullmetrix`;
    } else {
      window.location.href = "/tarifs";
    }
  } catch {
    window.location.href = "/tarifs";
  }
}

function authedItems(
  kind: Kind,
  roles: string[],
  onSignOut?: () => void
): MenuItem[] {
  const isAdminOrAgent = roles.includes("admin") || roles.includes("agent");

  // ====== MARKETPLACE MENU ======
  if (kind === "market") {
    const hasShop = hasShopNow();

    // on suit l’ordre de ta capture
    const items: MenuItem[] = [
      {
        label: "FM marketplace",
        icon: <Store />,
        href: "/marketplace",
      },
      {
        label: "Mes achats",
        icon: <Package />,
        href: "/marketplace/dashboard?tab=orders",
      },
      {
        label: "Panier",
        icon: <Cart />,
        href: "/marketplace/dashboard?tab=cart",
      },
      {
        // tu avais "Liste d’envies" ici → on met "Favoris" pour être aligné avec l’autre menu
        label: "Favoris",
        icon: <Heart />,
        href: "/marketplace/dashboard?tab=wishlist",
      },
      {
        label: hasShop ? "Ma boutique" : "Créer ma boutique",
        icon: <Store />,
        href: "/marketplace/dashboard?tab=shop",
      },
      {
        label: "Dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: "/marketplace/dashboard?tab=dashboard",
      },
    ];

    // si boutique → on ajoute la partie vendeurs (dans le bas)
    if (hasShop) {
      items.push(
        {
          label: "Liste des produits",
          icon: <Boxes className="w-5 h-5" />,
          href: "/marketplace/dashboard?tab=products",
        },
        {
          label: "Retrait",
          icon: <CreditCard className="w-5 h-5" />,
          href: "/marketplace/dashboard?tab=withdraw",
        }
      );
    }

    if (onSignOut) {
      items.push({
        label: "Se déconnecter",
        icon: <LogOut className="w-5 h-5" />,
        onClick: onSignOut,
        variant: "danger",
      });
    }

    return items;
  }

  // ====== COMMUNAUTÉ ======
  if (kind === "community") {
    const items: MenuItem[] = [
      {
        label: "Fil d’actualités",
        icon: <MessageSquareText className="w-5 h-5" />,
        href: "/communaute",
      },
      {
        label: "Mon espace",
        icon: <Users className="w-5 h-5" />,
        href: "/communaute/mon-espace",
      },
    ];

    if (onSignOut)
      items.push({
        label: "Se déconnecter",
        icon: <LogOut className="w-5 h-5" />,
        onClick: onSignOut,
        variant: "danger",
      });

    return items;
  }

  // ====== ACCOUNT ======
  const items: MenuItem[] = [];

  if (isAdminOrAgent) {
    items.push({
      label: "Gestion",
      icon: <Settings2 className="w-5 h-5" />,
      href: "/admin/messages?open=gestion",
    });
  }

  items.push({
    label: "Mes notes",
    icon: <Note />,
    href: "/notes",
  });

  items.push({
    label: "Tâches & projets",
    icon: <KanbanSquare className="w-5 h-5" />,
    href: "/projets",
  });

  items.push({
    label: "Finance",
    icon: <Chart />,
    href: "/finance",
  });

  items.push({
    label: "Journal de trading",
    icon: <Book />,
    href: "/journal",
  });

  // 🔓 FM Metrix déverrouillé mais contrôlé côté click
  items.push({
    label: "FM Metrix",
    icon: <LayoutDashboard className="w-5 h-5" />,
    onClick: () => {
      void handleFMMetrixClick();
    },
  });

  items.push({
    label: "Podcasts",
    icon: <Mic />,
    href: "/podcasts",
  });

  items.push({
    label: "Notifications",
    icon: <Bell />,
    href: "#notifications",
  });

  if (onSignOut)
    items.push({
      label: "Se déconnecter",
      icon: <LogOut className="w-5 h-5" />,
      onClick: onSignOut,
      variant: "danger",
    });

  return items;
}

export function buildMenu(
  kind: Kind,
  ctx: {
    status: "loading" | "anonymous" | "authenticated";
    roles: string[];
    onSignOut?: () => void;
  }
): MenuItem[] {
  if (ctx.status !== "authenticated") return guestItems();
  return authedItems(kind, ctx.roles || [], ctx.onSignOut);
}
