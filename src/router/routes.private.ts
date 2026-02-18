// src/router/routes.private.tsx
import { createElement, lazy } from "react";
import type { AppRoute } from "./guards";
import CheckoutGatePage from "./CheckoutGatePage";

// ✅ pages privées en lazy (zéro import lourd ici)
const NotesPage = lazy(() => import("../pages/notes"));
const PodcastsPage = lazy(() => import("../pages/podcasts"));
const FinancePage = lazy(() => import("../pages/finance"));
const JournalTrading = lazy(() => import("../pages/journal/JournalTrading"));
const ProjectsPage = lazy(() => import("../pages/projets/ProjectsPage"));
const NotificationsPage = lazy(() => import("../pages/notifications"));

const MarketplaceDashboard = lazy(() => import("../pages/marketplace"));

const FmMetrixResult = lazy(() => import("../pages/FmMetrixPaymentResult"));
const LiveRoomPage = lazy(() => import("../pages/direct/LiveRoomPage"));

export const PRIVATE_ROUTES: AppRoute[] = [
  {
    path: "/notes",
    element: createElement(NotesPage),
    guard: "private",
    redirectTo: "/",
  },
  {
    path: "/podcasts",
    element: createElement(PodcastsPage),
    guard: "private",
    redirectTo: "/",
  },
  {
    path: "/finance",
    element: createElement(FinancePage),
    guard: "private",
    redirectTo: "/",
  },
  {
    path: "/journal",
    element: createElement(JournalTrading),
    guard: "private",
    redirectTo: "/",
  },
  {
    path: "/notifications",
    element: createElement(NotificationsPage),
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/projects",
    element: createElement(ProjectsPage),
    guard: "private",
    redirectTo: "/",
  },
  {
    path: "/projets",
    element: createElement(ProjectsPage),
    guard: "private",
    redirectTo: "/",
  },


  {
    path: "/marketplace/dashboard",
    element: createElement(MarketplaceDashboard),
    guard: "private",
    redirectTo: "/",
  },

  // ✅ checkout: le gate + useCartItems sont dans un chunk séparé maintenant
  {
    path: "/marketplace/checkout",
    element: createElement(CheckoutGatePage),
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/journal-de-trading",
    element: createElement(JournalTrading),
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/fm-metrix/result",
    element: createElement(FmMetrixResult),
    guard: "private",
    redirectTo: "/",
  },

  // ✅ live page (layout LiveLayout géré dans routes.tsx)
  {
    path: "/direct/:id",
    element: createElement(LiveRoomPage),
    guard: "private",
    redirectTo: "/",
  },
];
