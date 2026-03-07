// src/core/router/routes.private.ts
import { createElement, lazy } from "react";
import type { AppRoute } from "./guards";
import CheckoutGatePage from "./CheckoutGatePage";

// ✅ pages privées en lazy (zéro import lourd ici)
const NotesPage = lazy(() => import("@features/notes"));
const PodcastsPage = lazy(() => import("@features/podcasts/PodcastsPage"));
const FinancePage = lazy(() => import("@features/finance/FinancePage"));
const JournalTrading = lazy(
  () => import("@features/journal/JournalTrading")
);
const ProjectsPage = lazy(
  () => import("@features/projects/ProjectsPage")
);
const NotificationsPage = lazy(
  () => import("@features/notifications/NotificationsPage")
);

const MarketplaceDashboard = lazy(() => import("@features/marketplace"));
const MarketplacePaymentResult = lazy(
  () => import("@features/marketplace/MarketplacePaymentResult")
);

const CoursePaymentResult = lazy(
  () => import("@features/courses/CoursePaymentResult")
);

const FmMetrixResult = lazy(
  () => import("@features/fm-metrix/FmMetrixPaymentResultPage")
);
const LiveRoomPage = lazy(() => import("@features/direct/LiveRoomPage"));

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

  {
    path: "/marketplace/checkout",
    element: createElement(CheckoutGatePage),
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/marketplace/result",
    element: createElement(MarketplacePaymentResult),
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/communaute/courses/result",
    element: createElement(CoursePaymentResult),
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
