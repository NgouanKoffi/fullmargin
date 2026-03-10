// src/core/router/routes.public.tsx
import { lazy } from "react";
import { Route } from "react-router-dom";

import { Guarded, OpenAuthModal } from "./guards";
import type { AppRoute } from "./guards";

/* ---------- Pages ---------- */
const Home = lazy(() => import("@features/home/HomePage"));
const Pricing = lazy(() => import("@features/pricing/PricingPage"));
const ConditionsUtilisation = lazy(() => import("@features/legal/TermsPage"));
const Confidentialite = lazy(() => import("@features/legal/PrivacyPage"));
const About = lazy(() => import("@features/about/AboutPage"));
const AuthSuccess = lazy(() => import("@features/auth-pages/AuthSuccessPage"));
const ProfilePage = lazy(() => import("@features/profile"));
const NotePublic = lazy(() => import("@features/notes/NotePublicPage"));
const AuthDeepLink = lazy(() => import("./AuthDeepLink"));

// Marketplace public
const MarketplacePublic = lazy(() => import("@features/marketplace/public"));
const ProductPreview = lazy(
  () => import("@features/marketplace/public/ProductPreview")
);
const ShopPublic = lazy(
  () => import("@features/marketplace/public/ShopPublic")
);

// Communauté public
const PublicCommunityHome = lazy(() => import("@features/community/public/PublicCommunity"));
const CommunityDetails = lazy(() => import("@features/community/private"));

// Layouts groupés
const MarketplaceLayout = lazy(() => import("@core/layouts/MarketplaceLayout"));
const CommunityLayout = lazy(() => import("@core/layouts/CommunityLayout"));

// ✅ FM Metrix Layout
const FmMetrixLayout = lazy(() => import("@core/layouts/FmMetrixLayout"));

// Courses
const CoursePublic = lazy(() => import("@features/courses/CoursePublic"));
const CoursePlayer = lazy(() => import("@features/courses/CoursePlayer"));

// Retrait + FAQ
const WithdrawPage = lazy(() => import("@features/wallet/WithdrawPage"));
const FAQ = lazy(() => import("@features/faq/FaqPage"));

// Pages légales
const MentionsLegales = lazy(() => import("@features/legal/LegalNoticePage"));
const CgvMarketplace = lazy(() => import("@features/legal/CgvPage"));
const CharteVendeur = lazy(() => import("@features/legal/SellerCharterPage"));
const PolitiqueRemboursement = lazy(() => import("@features/legal/RefundPage"));
const PolitiqueCookies = lazy(() => import("@features/legal/CookiesPage"));

// FM Metrix pages
const FmMetrixHistoryPage = lazy(
  () => import("@features/fm-metrix/FmMetrixHistoryPage")
);
const AboutFullMetrixPage = lazy(
  () => import("@features/fm-metrix/AboutFullMetrixPage")
);

/* ---------- Routes publiques ---------- */
export const PUBLIC_ROUTES: AppRoute[] = [
  { path: "/", element: <Home /> },
  { path: "/a-propos", element: <About /> },
  { path: "/tarifs", element: <Pricing /> },

  { path: "/conditions", element: <ConditionsUtilisation /> },
  { path: "/confidentialite", element: <Confidentialite /> },

  { path: "/mentions-legales", element: <MentionsLegales /> },
  { path: "/cgv", element: <CgvMarketplace /> },
  { path: "/charte-vendeur", element: <CharteVendeur /> },
  { path: "/remboursement", element: <PolitiqueRemboursement /> },
  { path: "/cookies", element: <PolitiqueCookies /> },

  { path: "/faq", element: <FAQ /> },

  { path: "/n", element: <NotePublic /> },
  { path: "/n/:sid", element: <NotePublic /> },
  { path: "/s/:token", element: <NotePublic /> },

  {
    path: "/connexion",
    element: <OpenAuthModal mode="signin" />,
    guard: "guest",
  },
  {
    path: "/inscription",
    element: <OpenAuthModal mode="signup" />,
    guard: "guest",
  },

  { path: "/auth", element: <AuthDeepLink /> },
];

/* ---------- Routes PlainLayout ---------- */
export const PLAIN_ROUTES: AppRoute[] = [
  { path: "/auth/success", element: <AuthSuccess /> },

  {
    path: "/profil",
    element: <ProfilePage />,
    guard: "private",
    redirectTo: "/",
  },

  {
    path: "/wallet/withdraw",
    element: <WithdrawPage />,
    guard: "private",
    redirectTo: "/connexion",
  },

  {
    path: "/fm-metrix/historique",
    element: <FmMetrixHistoryPage />,
    guard: "private",
    redirectTo: "/connexion",
  },
];

/* ---------- Helper ---------- */
export function mapRoutes(routes: AppRoute[]) {
  return routes.map((r) => (
    <Route
      key={r.path}
      path={r.path}
      element={r.guard || r.when ? <Guarded route={r} /> : r.element}
    />
  ));
}

/* ---------- Groupes sous layouts ---------- */
export function groupedPublicRouteElements() {
  return (
    <>
      <Route element={<MarketplaceLayout />}>
        <Route path="/marketplace" element={<MarketplacePublic />} />
        <Route
          path="/marketplace/public/product/:id"
          element={<ProductPreview />}
        />
        <Route
          path="/marketplace/public/shop/:slugOrId"
          element={<ShopPublic />}
        />
      </Route>

      <Route element={<CommunityLayout />}>
        <Route path="/communaute" element={<PublicCommunityHome />} />
        <Route path="/communaute/:slug" element={<CommunityDetails />} />
        <Route path="/communaute/formation/:id" element={<CoursePublic />} />
        <Route
          path="/communaute/courses/:id/learn"
          element={<CoursePlayer />}
        />
      </Route>

      {/* ✅ FM Metrix sous son layout */}
      <Route element={<FmMetrixLayout />}>
        <Route path="/fm-metrix/a-propos" element={<AboutFullMetrixPage />} />
      </Route>
    </>
  );
}
