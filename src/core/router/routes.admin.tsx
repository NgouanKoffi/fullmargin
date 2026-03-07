// src/core/router/routes.admin.tsx
import { createElement, lazy } from "react";
import type { AppRoute } from "./guards";

const AdminMessages = lazy(() => import("@features/admin/Messages"));
const AdminVisites = lazy(() => import("@features/admin/Visites"));
const AdminPermissions = lazy(() => import("@features/admin/AdminPermissions"));
const AdminUsersPage = lazy(() => import("@features/admin/Users"));
const AdminPodcastsPage = lazy(() => import("@features/admin/podcasts"));
const AdminMarketplacePage = lazy(() => import("@features/admin/marketplace"));
const FmMetrixAdminTab = lazy(
  () => import("@features/admin/fm-metrix/FmMetrixAdminTab")
);
const AdminCommunautePage = lazy(
  () => import("@features/admin/communities")
);

const AdminWithdrawalsPage = lazy(
  () => import("@features/wallet/AdminWithdrawalsPage")
);

const AdminMarketplaceCryptoPage = lazy(
  () => import("@features/admin/marketplaceCrypto")
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

  {
    path: "/admin/wallet/withdrawals",
    element: createElement(AdminWithdrawalsPage),
    guard: "private",
    when: ({ roles }) => isAdminOrAgent(roles),
    redirectTo: "/",
  },
];
