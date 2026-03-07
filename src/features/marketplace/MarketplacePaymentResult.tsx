// src/pages/marketplace/MarketplacePaymentResult.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

export default function MarketplacePaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("order");
    const provider = params.get("provider");
    const reference = params.get("reference") || "SDK_AUTO";
    const token = loadSession()?.token;

    if (!orderId || !token) {
      navigate("/marketplace", { replace: true });
      return;
    }

    const verify = async () => {
      try {
        // 1. On appelle la validation backend
        const res = await fetch(`${API_BASE}/payments/feexpay/verify-sdk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            feature: "marketplace",
            customId: orderId,
            reference: reference,
          }),
        });

        if (res.ok) {
          // 2. Succès ! On redirige vers l'onglet des commandes
          // On attend 1.5s pour que l'utilisateur voie que c'est bon
          setTimeout(() => {
            window.location.assign(
              `/marketplace/dashboard?tab=orders&ok=1&order=${orderId}&provider=${provider}`,
            );
          }, 1500);
        } else {
          setState("error");
        }
      } catch (err) {
        console.error(err);
        setState("error");
      }
    };

    void verify();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1115]">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        {state === "loading" ? (
          <>
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <h2 className="text-xl font-bold">
              Validation de votre commande...
            </h2>
            <p className="text-sm opacity-60 text-slate-500">
              Préparation de vos produits, un instant svp.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-500">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-red-500">
              Oups, une erreur est survenue.
            </h2>
            <button
              onClick={() => navigate("/marketplace/dashboard?tab=orders")}
              className="mt-2 text-emerald-500 font-semibold underline"
            >
              Aller à mes achats
            </button>
          </>
        )}
      </div>
    </div>
  );
}
