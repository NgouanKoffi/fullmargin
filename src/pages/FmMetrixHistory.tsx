// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\FmMetrixHistory.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE, getAuthToken } from "../lib/api";
import FmMetrixNotifications from "./admin/fullmetrix/components/FmMetrixNotifications";

type CurrentSub = {
  id: string;
  startedAt: string;
  validUntil: string;
  status: "active" | "expired";
  daysLeft?: number;
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

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const fmtDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString("fr-FR") : "—";
  const fmtAmount = (amount?: number, currency?: string) => {
    if (!amount) return "—";
    const cur = (currency || "").toUpperCase();
    if (cur === "XOF") return `${amount} XOF`;
    if (cur === "USD") return `${amount} $`;
    return `${amount} ${cur || ""}`.trim();
  };
  const buildInvoiceNumber = (item?: HistoryItem | null) => {
    if (!item) return "—";
    return `FMX-${item.id.slice(-6).toUpperCase()}`;
  };
  const providerLabel = (p?: string) => {
    const v = (p || "").toLowerCase();
    if (v === "fedapay") return "FedaPay";
    if (v === "stripe") return "Stripe";
    if (v === "manual_crypto") return "Crypto (USDT)";
    if (v === "manual_grant") return "Offert (Admin)";
    return v;
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-7 w-40 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-3xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mon Espace FM Metrix
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gérez votre abonnement, consultez vos factures et suivez vos
          notifications.
        </p>
      </header>

      {/* Carte d'abonnement principal */}
      <section className="bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900/40 rounded-3xl px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Début
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {current ? fmt(current.startedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Fin
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {current ? fmt(current.validUntil) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Temps restant
            </p>
            <p className="font-semibold text-emerald-500">
              {current && current.status === "active" ? countdown : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Statut
            </p>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                current && current.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {current && current.status === "active" ? "ACTIF" : "INACTIF"}
            </span>
          </div>
        </div>

        {/* ✅ LOGIQUE CORRIGÉE : On n'affiche le bouton que si NON ACTIF */}
        {(!current || current.status !== "active") && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/tarifs")}
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              {hasHistory
                ? "Renouveler mon abonnement"
                : "S'abonner maintenant"}
            </button>
          </div>
        )}
      </section>

      {/* --- GRID LAYOUT : Historique à gauche, Notifs à droite --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLONNE GAUCHE (2/3) : Historique */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Historique des paiements
            </h2>
          </div>

          <div className="bg-white/70 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900/40 rounded-3xl overflow-hidden">
            {!hasHistory ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aucun historique disponible.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === "active"
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {fmt(item.periodStart)} — {fmt(item.periodEnd)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 ml-4">
                        {fmtAmount(item.amount, item.currency)} via{" "}
                        {providerLabel(item.provider)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.status === "active" ? "En cours" : "Terminé"}
                      </span>
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                        Facture &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE (1/3) : Notifications */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <FmMetrixNotifications />
        </div>
      </div>

      {/* Overlay Facture */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-700">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-1">
              Détails de la transaction
            </h3>
            <p className="text-sm text-slate-400 font-mono mb-6">
              {buildInvoiceNumber(selected)}
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Date</span>
                <span>{fmtDateTime(selected.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Montant</span>
                <span className="font-bold text-xl">
                  {fmtAmount(selected.amount, selected.currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Moyen</span>
                <span className="capitalize">
                  {providerLabel(selected.provider)}
                </span>
              </div>
              <div className="pt-4 text-center">
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-white text-sm"
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
