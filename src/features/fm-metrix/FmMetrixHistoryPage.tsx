// src/pages/FmMetrixHistory.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, getAuthToken } from "@core/api/client";
import { useAuth } from "@core/auth/AuthContext";

type CurrentSub = {
  id: string;
  startedAt: string;
  validUntil: string;
  status: "active" | "expired";
  daysLeft?: number;
  autoRenew?: boolean; // ✅ Ajouté pour gérer l'état d'annulation
};

type HistoryItem = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  provider?: string;
};

export default function FmMetrixHistoriquePage() {
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [countdown, setCountdown] = useState<string>("");
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    async function run() {
      const token = getAuthToken();
      if (!token) {
        navigate("/connexion");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/payments/fm-metrix/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const c = data?.current ?? null;
        const h = Array.isArray(data?.history) ? data.history : [];
        setCurrent(
          c ? { ...c, startedAt: c.startedAt, validUntil: c.validUntil } : null,
        );
        setHistory(h);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (authStatus === "authenticated") void run();
  }, [authStatus, navigate]);

  useEffect(() => {
    if (!current || current.status !== "active") {
      setCountdown("");
      return;
    }
    const end = new Date(current.validUntil).getTime();
    function tick() {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setCountdown("0j 0h 0m 0s");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdown(`${days}j ${hours}h ${mins}m ${secs}s`);
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [current]);

  const hasHistory = history.length > 0;

  // ✅ Vérifie si l'utilisateur a déjà payé avec Stripe
  const hasStripeHistory = history.some((item) => item.provider === "stripe");

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const fmtDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString("fr-FR") : "—";
  const fmtAmount = (amount?: number, currency?: string) => {
    if (!amount) return "—";
    const cur = (currency || "").toUpperCase();
    if (cur === "XOF") return `${amount} FCFA`;
    if (cur === "USD") return `${amount} $`;
    return `${amount} ${cur || ""}`.trim();
  };
  const buildInvoiceNumber = (item?: HistoryItem | null) => {
    if (!item) return "—";
    return `FMX-${item.id.slice(-6).toUpperCase()}`;
  };
  const providerLabel = (p?: string) => {
    const v = (p || "").toLowerCase();
    if (v === "fedapay" || v === "feexpay") return "Mobile Money";
    if (v === "stripe") return "Stripe";
    if (v === "manual_crypto") return "Crypto (USDT)";
    if (v === "manual_grant") return "Offert (Admin)";
    return v;
  };

  // ✅ Logique d'annulation réelle
  const handleCancelSubscription = async () => {
    if (!hasStripeHistory) return;

    if (
      !window.confirm(
        "Voulez-vous vraiment annuler le renouvellement automatique ? Vous garderez votre accès jusqu'à la fin de la période en cours.",
      )
    ) {
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/payments/fm-metrix/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (json.ok) {
        alert(
          "Votre abonnement a été résilié. Vous recevrez un email de confirmation.",
        );
        if (current) {
          setCurrent({ ...current, autoRenew: false });
        }
      } else {
        alert(json.error || "Une erreur est survenue lors de la résiliation.");
      }
    } catch {
      alert("Erreur de connexion au serveur.");
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-7 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
        <div className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mon Espace FM Metrix
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
          Gérez votre abonnement et consultez l'historique de vos paiements.
        </p>
      </header>

      {/* Carte d'abonnement principal */}
      <section className="bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900/40 rounded-3xl px-6 py-6 sm:py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-sm relative overflow-hidden">
        {/* Ligne décorative en haut de la carte */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${current && current.status === "active" ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-slate-400 to-slate-500"}`}
        />

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 z-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Début
            </p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
              {current ? fmt(current.startedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Fin
            </p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
              {current ? fmt(current.validUntil) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Temps restant
            </p>
            <p className="font-semibold text-emerald-500 text-sm sm:text-base">
              {current && current.status === "active" ? countdown : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Statut
            </p>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold ${
                current && current.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {current && current.status === "active" ? "ACTIF" : "INACTIF"}
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full lg:w-auto flex-shrink-0">
          {!current || current.status !== "active" ? (
            <button
              onClick={() => navigate("/tarifs")}
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md w-full sm:w-auto"
            >
              {hasHistory
                ? "Renouveler mon abonnement"
                : "S'abonner maintenant"}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/fm-metrix/a-propos")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-md w-full sm:w-auto whitespace-nowrap"
              >
                Accéder à FM Metrix
              </button>

              {/* ✅ GESTION DU BOUTON DE RÉSILIATION */}
              {current.autoRenew === false ? (
                <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-center w-full sm:w-auto">
                  Renouvellement annulé
                </div>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={!hasStripeHistory}
                  title={
                    !hasStripeHistory
                      ? "Vous n'avez aucun prélèvement automatique actif"
                      : ""
                  }
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition w-full sm:w-auto whitespace-nowrap border ${
                    hasStripeHistory
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                      : "bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-70"
                  }`}
                >
                  Résilier l'abonnement
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Historique pleine largeur */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Historique des paiements
          </h2>
        </div>

        <div className="bg-white/70 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900/40 rounded-3xl overflow-hidden shadow-sm">
          {!hasHistory ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucun historique disponible.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === "active"
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {fmt(item.periodStart)} — {fmt(item.periodEnd)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-4 font-medium">
                      {fmtAmount(item.amount, item.currency)} via{" "}
                      {providerLabel(item.provider)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 ml-4 sm:ml-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wide ${
                        item.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.status === "active" ? "En cours" : "Terminé"}
                    </span>
                    <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                      Facture &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay Facture */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-sm p-6 sm:p-8 relative shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-1 tracking-tight">
              Détails de la transaction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-8">
              Réf: {buildInvoiceNumber(selected)}
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Date du paiement
                </span>
                <span className="font-semibold">
                  {fmtDateTime(selected.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Méthode utilisée
                </span>
                <span className="font-semibold capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                  {providerLabel(selected.provider)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Montant réglé
                </span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">
                  {fmtAmount(selected.amount, selected.currency)}
                </span>
              </div>

              <div className="pt-6 text-center">
                <button
                  onClick={() => setSelected(null)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
