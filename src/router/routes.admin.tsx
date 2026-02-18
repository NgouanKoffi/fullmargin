// src/router/routes.admin.ts
import { createElement, lazy } from "react";
import type { AppRoute } from "./guards";

const AdminMessages = lazy(() => import("../pages/admin/Messages"));
const AdminVisites = lazy(() => import("../pages/admin/Visites"));
const AdminPermissions = lazy(() => import("../pages/admin/AdminPermissions"));
const AdminUsersPage = lazy(() => import("../pages/admin/Users"));
const AdminPodcastsPage = lazy(() => import("../pages/admin/podcasts"));
const AdminMarketplacePage = lazy(() => import("../pages/admin/marketplace"));
const FmMetrixAdminTab = lazy(
  () => import("../pages/admin/fullmetrix/FmMetrixAdminTab"),
);
const AdminCommunautePage = lazy(() => import("../pages/admin/communautes"));

// ✅ AJOUT
const AdminWithdrawalsPage = lazy(
  () => import("../pages/wallet/AdminWithdrawalsPage"),
);

// ✅ AJOUT : MARKETPLACE CRYPTO
const AdminMarketplaceCryptoPage = lazy(
  () => import("../pages/admin/marketplaceCrypto"),
);

const isAdminOrAgent = (roles: string[]) =>
  roles.includes("admin") || roles.includes("agent");

export const ADMIN_ROUTES: AppRoute[] = [
  {
    path: "/admin/visites",
    element: createElement(AdminVisites),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/utilisateurs",
    element: createElement(AdminUsersPage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/permissions",
    element: createElement(AdminPermissions),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/messages",
    element: createElement(AdminMessages),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/podcasts",
    element: createElement(AdminPodcastsPage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/marketplace",
    element: createElement(AdminMarketplacePage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },

  // ✅ AJOUT : MARKETPLACE - CRYPTO
  {
    path: "/admin/marketplace-crypto",
    element: createElement(AdminMarketplaceCryptoPage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },

  {
    path: "/admin/fullmetrix",
    element: createElement(FmMetrixAdminTab),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
  {
    path: "/admin/communautes",
    element: createElement(AdminCommunautePage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },

  // ✅ AJOUT : RETRAITS ADMIN
  {
    path: "/admin/wallet/withdrawals",
    element: createElement(AdminWithdrawalsPage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
];
