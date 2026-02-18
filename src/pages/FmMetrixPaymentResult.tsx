// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\FmMetrixPaymentResult.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { loadSession } from "../auth/lib/storage";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeJson(resp: Response) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

export default function FmMetrixResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "error">("loading");
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(location.search);

    const status = (params.get("status") || "").toLowerCase();
    const sessionId = params.get("session_id") || "";
    const providerParam = (params.get("provider") || "").toLowerCase();

    // NOWPayments / crypto ids (robuste)
    const npId =
      params.get("NP_id") ||
      params.get("np_id") ||
      params.get("paymentId") ||
      params.get("payment_id") ||
      params.get("paymentid") ||
      params.get("id") ||
      params.get("tx") ||
      "";

    const session = loadSession?.();
    const token = session?.token;

    const goTarifs = (delayMs = 1500) => {
      setTimeout(() => {
        if (!cancelled) navigate("/tarifs", { replace: true });
      }, delayMs);
    };

    if (!token) {
      navigate("/tarifs", { replace: true });
      return () => {
        cancelled = true;
      };
    }

    // annulation/échec immédiat
    if (["cancel", "canceled", "declined", "failed"].includes(status)) {
      navigate("/tarifs", { replace: true });
      return () => {
        cancelled = true;
      };
    }

    // ✅ Stripe si et seulement si on a session_id
    const isStripe = !!sessionId;
    const provider = isStripe ? "stripe" : providerParam || "nowpayments";

    (async () => {
      try {
        // ---------------------------
        // 1) STRIPE
        // ---------------------------
        if (provider === "stripe") {
          const confirmResp = await fetch(
            `${API_BASE}/payments/fm-metrix/confirm?session_id=${encodeURIComponent(
              sessionId
            )}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const confirmData = await safeJson(confirmResp);

          if (!confirmResp.ok || !confirmData?.ok) {
            if (!cancelled) {
              setState("error");
              goTarifs(1500);
            }
            return;
          }

          const ssoResp = await fetch(
            `${API_BASE}/auth/sso/fullmetrix?mode=json`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const ssoData = await safeJson(ssoResp);

          if (ssoResp.ok && ssoData?.ok && ssoData?.redirectUrl) {
            window.location.href = ssoData.redirectUrl;
            return;
          }

          if (!cancelled) {
            setState("error");
            goTarifs(1500);
          }
          return;
        }

        // ---------------------------
        // 2) CRYPTO (NOWPAYMENTS, etc.)
        // ---------------------------
        const MAX_TRIES = 25; // ~50s
        const WAIT_MS = 2000;

        setHint(
          `Confirmation ${provider} en cours…${npId ? ` (id: ${npId})` : ""}`
        );

        // Helper: refresh nowpayments (déclenche dispatchPayment côté backend)
        async function tryNowRefresh() {
          // On ne refresh que pour NOWPayments (sinon inutile)
          if (provider !== "nowpayments") return { ok: true };

          if (!npId) {
            return {
              ok: false,
              error: "Identifiant NOWPayments manquant (NP_id)",
            };
          }

          const r = await fetch(`${API_BASE}/payments/nowpayments/refresh`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentId: npId }),
          });

          const d = await safeJson(r);

          return {
            ok: r.ok && d?.ok,
            status: r.status,
            data: d,
          };
        }

        // On tente un refresh immédiat dès l’arrivée (utile en local)
        if (provider === "nowpayments") {
          const first = await tryNowRefresh();
          if (!first.ok) {
            // si 401 => session expirée
            if (first.status === 401) {
              if (!cancelled) {
                setState("error");
                goTarifs(1200);
              }
              return;
            }
          }
        }

        for (let i = 1; i <= MAX_TRIES; i++) {
          if (cancelled) return;

          // Toutes les 1-2 itérations, on refresh NOWPayments
          // (évite d'attendre l'IPN et rend le flow fiable)
          if (provider === "nowpayments") {
            const ref = await tryNowRefresh();

            if (!ref.ok) {
              // 401 => plus de token valide
              if (ref.status === 401) {
                setHint("Session expirée. Redirection…");
                setState("error");
                goTarifs(1200);
                return;
              }

              // si NP_id manquant ou autre souci, on continue le polling access
              // (mais ça échouera probablement, donc on affiche le hint)
              if (ref?.data?.error) {
                setHint(
                  `Confirmation nowpayments… (${i}/${MAX_TRIES})${
                    npId ? ` (id: ${npId})` : ""
                  }`
                );
              }
            }
          }

          // check access
          const accessResp = await fetch(
            `${API_BASE}/payments/fm-metrix/access`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const accessData = await safeJson(accessResp);

          if (accessResp.ok && accessData?.ok && accessData.allowed) {
            const ssoResp = await fetch(
              `${API_BASE}/auth/sso/fullmetrix?mode=json`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const ssoData = await safeJson(ssoResp);

            if (ssoResp.ok && ssoData?.ok && ssoData?.redirectUrl) {
              window.location.href = ssoData.redirectUrl;
              return;
            }

            // accès OK mais SSO KO → erreur
            break;
          }

          setHint(
            `Confirmation ${provider}… (${i}/${MAX_TRIES})${
              npId ? ` (id: ${npId})` : ""
            }`
          );
          await sleep(WAIT_MS);
        }

        if (!cancelled) {
          setState("error");
          goTarifs(2000);
        }
      } catch (e) {
        console.error("[FmMetrixResult] erreur:", e);
        if (!cancelled) {
          setState("error");
          goTarifs(2000);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-surface text-skin-base dark:bg-[#0f1115] dark:text-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
        {state === "loading" ? (
          <>
            <p className="text-sm opacity-80">
              Validation de votre paiement FM Metrix…
            </p>
            <p className="text-xs opacity-60">
              {hint || "Vous allez être redirigé automatiquement."}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-red-400">
              Impossible de finaliser le paiement.
            </p>
            <p className="text-xs opacity-60">Redirection vers les tarifs…</p>
          </>
        )}
      </div>
    </div>
  );
}
