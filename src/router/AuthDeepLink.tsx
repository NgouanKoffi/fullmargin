// src/router/AuthDeepLink.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthDeepLink() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const mode = sp.get("tab") === "signin" ? "signin" : "signup";
    const ref = (sp.get("ref") || "").toUpperCase();

    if (ref) localStorage.setItem("fm:referral", ref);
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } })
    );

    navigate("/", { replace: true });
  }, [location.search, navigate]); // ✅ dépendances correctes

  return null;
}
