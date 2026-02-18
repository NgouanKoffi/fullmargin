// src/router/routes.tsx
import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";

/* Layouts */
import DefaultLayout from "../layouts/PublicLayout";
import NotFoundLayout from "../layouts/NotFoundLayout";

// ✅ Lazy layouts (pas chargés sur la home)
const PlainLayout = lazy(() => import("../layouts/PlainLayout"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const PrivateLayout = lazy(() => import("../layouts/PrivateLayout"));
const LiveLayout = lazy(() => import("../layouts/LiveLayout"));

/* Route groups */
import {
  PUBLIC_ROUTES,
  PLAIN_ROUTES,
  groupedPublicRouteElements,
} from "./routes.public";
import { PRIVATE_ROUTES } from "./routes.private";
import { Guarded } from "./guards";
import type { AppRoute } from "./guards";
import { ADMIN_ROUTES } from "./routes.admin";

export default function AppRoutes() {
  const liveRoute = PRIVATE_ROUTES.find((r) => r.path === "/direct/:id");

  return (
    <Routes>
      {/* 🔹 Public */}
      <Route element={<DefaultLayout />}>
        {PUBLIC_ROUTES.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={r.guard || r.when ? <Guarded route={r} /> : r.element}
          />
        ))}
      </Route>

      {/* 🔸 Plain (OAuth + Profil) */}
      <Route element={<PlainLayout />}>
        {PLAIN_ROUTES.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={r.guard || r.when ? <Guarded route={r} /> : r.element}
          />
        ))}
      </Route>

      {/* 🧩 Groupes publics */}
      {groupedPublicRouteElements()}

      {/* 🔐 Private */}
      <Route element={<PrivateLayout />}>
        {PRIVATE_ROUTES.filter((r) => r.path !== "/direct/:id").map((r) => {
          const relativePath = r.path.startsWith("/")
            ? r.path.slice(1)
            : r.path;
          return (
            <Route
              key={r.path}
              path={relativePath}
              element={<Guarded route={r} />}
            />
          );
        })}
      </Route>

      {/* 🎥 Live / direct : fullscreen */}
      {liveRoute && (
        <Route element={<LiveLayout />}>
          <Route
            path={
              liveRoute.path.startsWith("/")
                ? liveRoute.path.slice(1)
                : liveRoute.path
            }
            element={<Guarded route={liveRoute} />}
          />
        </Route>
      )}

      {/* 🧭 Admin */}
      <Route element={<AdminLayout />}>
        {ADMIN_ROUTES.map((r: AppRoute) => (
          <Route key={r.path} path={r.path} element={<Guarded route={r} />} />
        ))}
      </Route>

      {/* 🔻 404 */}
      <Route element={<NotFoundLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
