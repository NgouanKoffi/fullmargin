// src/components/Header/menu.tsx
import { type ReactNode, useEffect, useState, useMemo } from "react";
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
} from "../components/icons";
import {
  Settings2,
  LogOut,
  KanbanSquare,
  Boxes,
  LayoutDashboard,
  CreditCard,
  Users,
  MessageSquareText,
  Radio,
} from "lucide-react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

export type Kind = "market" | "account" | "community";

export type MenuItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "danger" | "default";
  locked?: boolean;
};

function guestItems(): MenuItem[] {
  return [];
}

async function handleFMMetrixClick() {
  if (typeof window === "undefined") return;
  const session = loadSession?.();
  const token = session?.token;

  if (!token) {
    window.location.href = "/tarifs";
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
      headers: { Authorization: `Bearer ${token}` },
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
  onSignOut?: () => void,
  hasShop: boolean = false,
): MenuItem[] {
  const isAdminOrAgent = roles.includes("admin") || roles.includes("agent");

  if (kind === "market") {
    const items: MenuItem[] = [
      { label: "FM marketplace", icon: <Store />, href: "/marketplace" },
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
        },
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

  if (kind === "community") {
    return [
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
      ...(onSignOut
        ? [
            {
              label: "Se déconnecter",
              icon: <LogOut className="w-5 h-5" />,
              onClick: onSignOut,
              variant: "danger" as const,
            },
          ]
        : []),
    ];
  }

  const items: MenuItem[] = [];
  if (isAdminOrAgent) {
    items.push({
      label: "Gestion",
      icon: <Settings2 className="w-5 h-5" />,
      href: "/admin/messages?open=gestion",
    });
  }

  items.push({ label: "Mes notes", icon: <Note />, href: "/notes" });
  items.push({
    label: "Tâches & projets",
    icon: <KanbanSquare className="w-5 h-5" />,
    href: "/projets",
  });
  items.push({ label: "Finance", icon: <Chart />, href: "/finance" });
  items.push({ label: "Journal de trading", icon: <Book />, href: "/journal" });
  items.push({
    label: "Lancer Live",
    icon: <Radio className="w-5 h-5" />,
    onClick: () => {
      window.dispatchEvent(new CustomEvent("fm:launch-instant-live"));
    },
  });
  items.push({
    label: "FM Metrix",
    icon: <LayoutDashboard className="w-5 h-5" />,
    onClick: () => {
      void handleFMMetrixClick();
    },
  });
  items.push({ label: "Podcasts", icon: <Mic />, href: "/podcasts" });

  // ✅ Correction de l'URL
  items.push({
    label: "Notifications",
    icon: <Bell />,
    href: "/notifications",
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

export function useMenu(
  kind: Kind,
  ctx: { status: string; roles: string[]; onSignOut?: () => void },
): MenuItem[] {
  const [hasShop, setHasShop] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem("fm:shop:exists") === "1",
  );

  useEffect(() => {
    if (ctx.status !== "authenticated") return;
    const token = loadSession()?.token;
    if (!token || hasShop || kind !== "market") return;

    fetch(`${API_BASE}/marketplace/shops/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.data?.shop) {
          sessionStorage.setItem("fm:shop:exists", "1");
          setHasShop(true);
        }
      })
      .catch(() => {});
  }, [ctx.status, kind, hasShop]);

  return useMemo(() => {
    if (ctx.status !== "authenticated") return guestItems();
    return authedItems(kind, ctx.roles || [], ctx.onSignOut, hasShop);
  }, [kind, ctx.status, ctx.roles, ctx.onSignOut, hasShop]);
}

export function buildMenu(
  kind: Kind,
  ctx: { status: string; roles: string[]; onSignOut?: () => void },
): MenuItem[] {
  const hasShop =
    typeof window !== "undefined" &&
    sessionStorage.getItem("fm:shop:exists") === "1";
  if (ctx.status !== "authenticated") return guestItems();
  return authedItems(kind, ctx.roles || [], ctx.onSignOut, hasShop);
}
