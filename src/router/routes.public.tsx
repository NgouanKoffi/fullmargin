// src/router/routes.public.tsx
import { lazy } from "react";
import { Route } from "react-router-dom";

import { Guarded, OpenAuthModal } from "./guards";
import type { AppRoute } from "./guards";

/* ---------- Pages ---------- */
const Home = lazy(() => import("../pages/Home"));
const Pricing = lazy(() => import("../pages/Pricing"));
const ConditionsUtilisation = lazy(
  () => import("../pages/ConditionsUtilisations")
);
const Confidentialite = lazy(() => import("../pages/confidentialite"));
const About = lazy(() => import("../pages/About"));
const AuthSuccess = lazy(() => import("../pages/AuthSuccess"));
const ProfilePage = lazy(() => import("../pages/profil"));
const NotePublic = lazy(() => import("../pages/NotePublic"));
const AuthDeepLink = lazy(() => import("./AuthDeepLink"));

// Marketplace public
const MarketplacePublic = lazy(() => import("../pages/marketplace/public"));
const ProductPreview = lazy(
  () => import("../pages/marketplace/public/ProductPreview")
);
const ShopPublic = lazy(() => import("../pages/marketplace/public/ShopPublic"));

// Communauté public
const PublicCommunityHome = lazy(() => import("../pages/communaute/public"));
const CommunityDetails = lazy(() => import("../pages/communaute/private"));

// Layouts groupés
const MarketplaceLayout = lazy(() => import("../layouts/MarketplaceLayout"));
const CommunauteLayout = lazy(() => import("../layouts/CommunauteLayout"));

// ✅ FM Metrix Layout
const FmMetrixLayout = lazy(() => import("../layouts/FmMetrixLayout"));

// Courses
const CoursePublic = lazy(() => import("../pages/course/CoursePublic"));
const CoursePlayer = lazy(() => import("../pages/course/CoursePlayer"));

// Retrait + FAQ
const WithdrawPage = lazy(() => import("../pages/wallet/WithdrawPage"));
const FAQ = lazy(() => import("../pages/faq"));

// Pages légales
const MentionsLegales = lazy(() => import("../pages/MentionsLegales"));
const CgvMarketplace = lazy(() => import("../pages/CgvMarketplace"));
const CharteVendeur = lazy(() => import("../pages/CharteVendeur"));
const PolitiqueRemboursement = lazy(
  () => import("../pages/PolitiqueRemboursement")
);
const PolitiqueCookies = lazy(() => import("../pages/PolitiqueCookies"));

// FM Metrix pages
const FmMetrixHistoryPage = lazy(() => import("../pages/FmMetrixHistory"));
const AboutFullMetrixPage = lazy(
  () => import("../pages/fm-metrix/AboutFullMetrixPage")
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

  // ✅ ON SUPPRIME la route fm-metrix d'ici (elle sera sous son layout)
  // { path: "/fm-metrix/a-propos", element: <AboutFullMetrixPage /> },
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

      <Route element={<CommunauteLayout />}>
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
        {/* si tu veux aussi mettre l'historique ici plus tard, tu peux */}
        {/* <Route path="/fm-metrix/historique" element={<Guarded route={{path:"/fm-metrix/historique", element:<FmMetrixHistoryPage/>, guard:"private", redirectTo:"/connexion"}} />} /> */}
      </Route>
    </>
  );
}
