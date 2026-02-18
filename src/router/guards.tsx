// C:\Users\ADMIN\Desktop\fullmargin-site\src\router\guards.tsx
import { useEffect } from "react";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export type Guard = "public" | "private" | "guest";

export type AppRoute = {
  path: string;
  element: ReactElement;
  guard?: Guard;
  when?: (ctx: {
    status: "loading" | "anonymous" | "authenticated";
    roles: string[];
  }) => boolean;
  redirectTo?: string;
};

export function OpenAuthModal({
  mode,
  to = "/",
}: {
  mode: "signin" | "signup";
  to?: string;
}) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } })
    );
  }, [mode]);
  return <Navigate to={to} replace />;
}

export function KickToSignIn({ to }: { to: string }) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
    );
  }, []);
  return <Navigate to={to} replace />;
}

export function Guarded({ route }: { route: AppRoute }) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];

  if (status === "loading") return null;

  if (route.guard === "private" && status !== "authenticated") {
    return <KickToSignIn to={route.redirectTo ?? "/"} />;
  }
  if (route.guard === "guest" && status === "authenticated") {
    return <Navigate to={route.redirectTo ?? "/"} replace />;
  }
  if (route.when && !route.when({ status, roles })) {
    return <Navigate to={route.redirectTo ?? "/"} replace />;
  }

  return route.element;
}
