// src/pages/communaute/private/community-details/tabs/AchatsTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { loadSession } from "../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../lib/api";

/* ---------- Types ---------- */
type SessionUser = { _id?: string; id?: string };
type Session = { token?: string; user?: SessionUser } | null;

type StripeAmounts = {
  currency?: string;
  amount?: number | null;
  fee?: number | null;
  net?: number | null;
  amountCents?: number | null;
  feeCents?: number | null;
  netCents?: number | null;
} | null;

type StripePaymentMethod = {
  type?: string | null;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
} | null;

type StripeInfo = {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  chargeId?: string | null;
  receiptUrl?: string | null;
  customerEmail?: string | null;
  amounts?: StripeAmounts;
  paymentMethod?: StripePaymentMethod;
} | null;

type PaymentStatus = "requires_payment" | "succeeded" | "failed" | "canceled";
type UiStatus = "idle" | PaymentStatus;

type RefreshResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  data?: {
    order?: {
      id: string;
      status: PaymentStatus;
      paidAt: string | null;
      course?: string;
      courseTitle?: string | null;
      stripe?: StripeInfo;
    };
    enrolled?: boolean;
  };
};

type NowPaymentsRefreshResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  data?: {
    order?: {
      id: string;
      status: PaymentStatus;
      paidAt: string | null;
      course?: string | null;
    };
    enrolled?: boolean;
    nowpayments?: {
      kind?: string;
      id?: string;
      rawStatus?: string | null;
      normalized?: string;
    };
  };
};

// ===== Inscriptions (courses auxquels l'utilisateur a accès) =====
type EnrollmentCourse = {
  id: string;
  title: string;
  coverUrl: string;
  communityId: string | null;
  priceType: "free" | "paid";
  currency: string;
  price: number | null;
  isActive: boolean;
};

type EnrollmentItem = {
  id: string; // enrollment id
  enrolledAt: string | null;
  course: EnrollmentCourse;
};

type EnrollmentsResponse = {
  ok?: boolean;
  data?: { items?: EnrollmentItem[] };
};

// ===== Historique des paiements (orders) =====
type OrderCourse = {
  id: string;
  title: string;
  coverUrl: string;
  communityId: string | null;
};

type OrderAmounts = {
  currency: string;
  amount: number | null;
  amountCents: number | null;
  fee: number | null;
  feeCents: number | null;
  netAfterStripe: number | null;
  netAfterStripeCents: number | null;
};

type OrderItem = {
  id: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string | null;
  course: OrderCourse;
  amounts: OrderAmounts;
  receiptUrl: string | null;
};

type OrdersResponse = {
  ok?: boolean;
  data?: { items?: OrderItem[]; page?: number; total?: number };
};

/* ---------- Helpers ---------- */
function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Format monétaire sûr */
function fmtMoney(value: number | null | undefined, currency = "USD") {
  if (typeof value !== "number") return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency.toUpperCase()}`;
  }
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function AchatsTab() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  // params URL
  const paid = sp.get("paid");
  const orderId = sp.get("order") || "";
  const sessionId = sp.get("session_id") || "";
  const courseIdFromUrl = sp.get("course") || "";

  // provider
  const provider = (sp.get("provider") || "").toLowerCase();

  // FedaPay
  const fedapayStatus = sp.get("status");
  const tx = sp.get("tx");

  // NowPayments
  const feature = (sp.get("feature") || "").toLowerCase();
  const npId =
    sp.get("NP_id") ||
    sp.get("payment_id") ||
    sp.get("invoice_id") ||
    sp.get("np_id") ||
    "";

  const initialFromStripe: boolean = paid === "1" && !!(sessionId || orderId);
  const initialFromFedapay: boolean =
    provider === "fedapay" && !!(fedapayStatus || tx);
  const initialFromNowPayments: boolean =
    provider === "nowpayments" && feature === "course" && !!orderId;

  const flowProvider: "stripe" | "nowpayments" | "none" = initialFromStripe
    ? "stripe"
    : initialFromNowPayments
      ? "nowpayments"
      : "none";

  // on fige le fait qu'on vient d'un paiement (Stripe ou NowPayments) pour le bloc de statut
  const [cameFromPayment] = useState<boolean>(
    initialFromStripe || initialFromNowPayments,
  );

  // état UI paiement
  const [loading, setLoading] = useState<boolean>(
    initialFromStripe || initialFromNowPayments,
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState<string>("");
  const [courseId, setCourseId] = useState<string>(courseIdFromUrl || "");

  // état “mes inscriptions”
  const [enrollments, setEnrollments] = useState<EnrollmentItem[] | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(false);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  // état “mes paiements / factures”
  const [orders, setOrders] = useState<OrderItem[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // état des tabs
  const [activeTab, setActiveTab] = useState<"payments" | "courses">(
    "payments",
  );

  const lastStatusRef = useRef<UiStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Libellés FR pour les statuts
  const statusLabel = useMemo(() => {
    switch (status) {
      case "succeeded":
        return "Payé ✅";
      case "requires_payment":
        return "En attente de confirmation";
      case "failed":
        return "Paiement échoué";
      case "canceled":
        return "Paiement annulé";
      default:
        return "";
    }
  }, [status]);

  function cleanupUrlParams() {
    const url = new URL(window.location.href);

    // Stripe
    url.searchParams.delete("paid");
    url.searchParams.delete("order");
    url.searchParams.delete("session_id");
    url.searchParams.delete("course");

    // FedaPay
    url.searchParams.delete("provider");
    url.searchParams.delete("status");
    url.searchParams.delete("tx");

    // NowPayments
    url.searchParams.delete("feature");
    url.searchParams.delete("NP_id");
    url.searchParams.delete("np_id");
    url.searchParams.delete("payment_id");
    url.searchParams.delete("invoice_id");

    window.history.replaceState({}, "", url.toString());
  }

  async function doStripeRefreshOnce(args: {
    orderId?: string;
    sessionId?: string;
    signal?: AbortSignal;
  }) {
    const body: Record<string, string> = {};
    if (args.orderId) body.orderId = args.orderId;
    if (args.sessionId) body.sessionId = args.sessionId;

    const res = await fetch(`${API_BASE}/courses/payments/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      signal: args.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || "Refresh impossible");
    }

    const json = (await res.json().catch(() => null)) as RefreshResponse | null;
    const o = json?.data?.order;
    if (!o) throw new Error("Commande introuvable après paiement.");
    return o;
  }

  async function doNowPaymentsRefreshOnce(args: {
    orderId: string;
    npId?: string;
    signal?: AbortSignal;
  }) {
    const body: Record<string, string> = { orderId: args.orderId };
    if (args.npId) body.NP_id = args.npId;

    const res = await fetch(`${API_BASE}/payments/nowpayments/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      signal: args.signal,
    });

    const raw = await res.text().catch(() => "");

    if (!res.ok) {
      // tente d'extraire error/message JSON, sinon raw
      try {
        const j = JSON.parse(raw) as { error?: string; message?: string };
        throw new Error(j?.error || j?.message || raw || "Refresh impossible");
      } catch {
        throw new Error(raw || "Refresh impossible");
      }
    }

    let json: NowPaymentsRefreshResponse | null = null;
    try {
      json = JSON.parse(raw) as NowPaymentsRefreshResponse;
    } catch {
      json = null;
    }

    if (!json?.ok) {
      throw new Error(
        json?.error ||
          json?.message ||
          "Impossible de vérifier le paiement NowPayments.",
      );
    }

    const o = json?.data?.order;
    if (!o) throw new Error("Commande introuvable après refresh NowPayments.");
    return o;
  }

  /** Polling silencieux avec backoff jusqu'à statut final (Stripe) */
  async function pollStripeUntilTerminal() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    let attempt = 0;
    const maxAttempt = 10;

    try {
      while (isMountedRef.current && attempt < maxAttempt) {
        const o = await doStripeRefreshOnce({
          orderId,
          sessionId,
          signal: controller.signal,
        });

        const nextStatus = o.status as UiStatus;
        const changed = nextStatus !== lastStatusRef.current;

        if (changed) {
          lastStatusRef.current = nextStatus;
          setStatus(nextStatus);
        }

        setPaidAt(o.paidAt || null);
        setReceiptUrl(o.stripe?.receiptUrl || null);

        const cur = (o.stripe?.amounts?.currency || "USD").toUpperCase();
        const amtStr = fmtMoney(o.stripe?.amounts?.amount ?? null, cur);
        setAmountLabel(amtStr);

        setCourseId(o.course || courseIdFromUrl || "");

        if (["succeeded", "failed", "canceled"].includes(nextStatus)) break;

        attempt += 1;
        const delays = [1500, 2500, 4000, 6000, 8000];
        const delay = delays[Math.min(attempt - 1, delays.length - 1)];
        const extra =
          typeof document !== "undefined" &&
          document.visibilityState === "hidden"
            ? 1500
            : 0;

        await new Promise((r) => setTimeout(r, delay + extra));
      }
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return;
      if (isMountedRef.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de vérifier le paiement pour le moment.",
        );
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  /** Polling silencieux avec backoff jusqu'à statut final (NowPayments) */
  async function pollNowPaymentsUntilTerminal() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    let attempt = 0;
    const maxAttempt = 10;

    try {
      while (isMountedRef.current && attempt < maxAttempt) {
        const o = await doNowPaymentsRefreshOnce({
          orderId,
          npId: npId || undefined,
          signal: controller.signal,
        });

        const nextStatus = (o.status || "requires_payment") as UiStatus;
        const changed = nextStatus !== lastStatusRef.current;

        if (changed) {
          lastStatusRef.current = nextStatus;
          setStatus(nextStatus);
        }

        setPaidAt(o.paidAt || null);

        // courseId / montant : on les récupère via /mine (ou déjà en state)
        // -> on laisse la logique "history-driven" faire le reste.

        if (["succeeded", "failed", "canceled"].includes(nextStatus)) break;

        attempt += 1;
        const delays = [1500, 2500, 4000, 6000, 8000];
        const delay = delays[Math.min(attempt - 1, delays.length - 1)];
        const extra =
          typeof document !== "undefined" &&
          document.visibilityState === "hidden"
            ? 1500
            : 0;

        await new Promise((r) => setTimeout(r, delay + extra));
      }
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return;
      if (isMountedRef.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de vérifier le paiement NowPayments pour le moment.",
        );
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  // ===== fetch de la liste des inscriptions =====
  async function fetchEnrollments() {
    try {
      setEnrollmentsLoading(true);
      setEnrollmentsError(null);

      const r = await fetch(`${API_BASE}/communaute/courses/me/enrollments`, {
        headers: { Accept: "application/json", ...authHeaders() },
      });

      const raw = await r.text();
      if (!r.ok) {
        let msg = "Lecture des achats impossible";
        try {
          const errJson = JSON.parse(raw) as {
            error?: string;
            message?: string;
          };
          msg = errJson.error || errJson.message || msg;
        } catch {
          if (raw) msg = raw;
        }
        throw new Error(msg);
      }

      let j: EnrollmentsResponse | null = null;
      try {
        j = JSON.parse(raw) as EnrollmentsResponse;
      } catch {
        throw new Error("Réponse invalide du serveur");
      }

      const items = j?.data?.items || [];
      setEnrollments(items);
    } catch (e) {
      setEnrollmentsError(
        e instanceof Error ? e.message : "Lecture des achats impossible",
      );
      setEnrollments(null);
    } finally {
      setEnrollmentsLoading(false);
    }
  }

  // ===== fetch de l'historique des paiements =====
  async function fetchOrders() {
    try {
      setOrdersLoading(true);
      setOrdersError(null);

      const r = await fetch(`${API_BASE}/courses/payments/mine`, {
        headers: { Accept: "application/json", ...authHeaders() },
      });

      const raw = await r.text();
      if (!r.ok) {
        let msg = "Lecture des paiements impossible";
        try {
          const errJson = JSON.parse(raw) as {
            error?: string;
            message?: string;
          };
          msg = errJson.error || errJson.message || msg;
        } catch {
          if (raw) msg = raw;
        }
        throw new Error(msg);
      }

      let j: OrdersResponse | null = null;
      try {
        j = JSON.parse(raw) as OrdersResponse;
      } catch {
        throw new Error("Réponse invalide du serveur (paiements)");
      }

      const items = j?.data?.items || [];
      setOrders(items);
    } catch (e) {
      setOrdersError(
        e instanceof Error ? e.message : "Lecture des paiements impossible",
      );
      setOrders(null);
    } finally {
      setOrdersLoading(false);
    }
  }

  // ===== order en cours depuis l'historique (source de vérité UI) =====
  const orderFromHistory = useMemo(() => {
    if (!orderId) return null;
    if (!Array.isArray(orders)) return null;
    return orders.find((o) => o.id === orderId) || null;
  }, [orders, orderId]);

  const paymentConfirmed =
    status === "succeeded" || orderFromHistory?.status === "succeeded";

  // ✅ Si l'historique dit "Payé", on efface toute erreur "refresh" et on aligne l'encart du haut
  useEffect(() => {
    if (!orderFromHistory) return;

    if (orderFromHistory.status === "succeeded") {
      setError(null);
      setLoading(false);
      setStatus("succeeded");

      setPaidAt(orderFromHistory.paidAt ?? null);
      setReceiptUrl(orderFromHistory.receiptUrl ?? null);

      const cur = (orderFromHistory.amounts?.currency || "USD").toUpperCase();
      const amt = fmtMoney(orderFromHistory.amounts?.amount ?? null, cur);
      if (amt) setAmountLabel(amt);

      const cid = orderFromHistory.course?.id || "";
      if (cid) setCourseId(cid);
    }
  }, [orderFromHistory]);

  // ------- Mount principal -------
  useEffect(() => {
    isMountedRef.current = true;
    lastStatusRef.current = "idle";

    // on charge tout dès l’arrivée sur l’onglet
    fetchEnrollments();
    fetchOrders();

    // Retour Stripe (polling + nettoyage URL)
    if (initialFromStripe) {
      pollStripeUntilTerminal().finally(() => {
        cleanupUrlParams();
      });
    }

    // Retour NowPayments (polling + nettoyage URL)
    if (initialFromNowPayments) {
      pollNowPaymentsUntilTerminal().finally(() => {
        cleanupUrlParams();
      });
    }

    // Retour FedaPay : on se contente de nettoyer l’URL
    if (initialFromFedapay) {
      cleanupUrlParams();
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;

      // si déjà confirmé, ne pas relancer un refresh qui peut mettre une erreur inutile
      if (paymentConfirmed) return;

      if (initialFromStripe) pollStripeUntilTerminal();
      if (initialFromNowPayments) pollNowPaymentsUntilTerminal();
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialFromStripe,
    initialFromNowPayments,
    initialFromFedapay,
    orderId,
    sessionId,
    npId,
  ]);

  // Rafraîchir les inscriptions & l'historique quand un paiement passe à "succeeded"
  useEffect(() => {
    if (status === "succeeded") {
      fetchEnrollments();
      fetchOrders();
    }
  }, [status]);

  return (
    <div className="w-full">
      {/* ---------- TABS PRINCIPAUX ---------- */}
      <div className="flex border-b mb-6 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "payments"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Mes paiements
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`ml-4 px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "courses"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Mes cours inscrits
        </button>
      </div>

      {/* ---------- CONTENU ---------- */}
      <section className="space-y-4 sm:space-y-5">
        {activeTab === "payments" && (
          <>
            {/* Carte principale - synthèse / retour paiement */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-6">
              <h2 className="text-lg font-semibold">Achats</h2>

              {!cameFromPayment && (
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Historique de vos achats / abonnements. Les formations
                  gratuites auxquelles vous vous êtes inscrit apparaîtront
                  également ici.
                </p>
              )}

              {cameFromPayment && (
                <div className="mt-4">
                  {loading && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finalisation de votre paiement… (vérification{" "}
                      {flowProvider === "stripe" ? "Stripe" : "NowPayments"})
                    </div>
                  )}

                  {/* ✅ erreur seulement si pas déjà confirmé via l'historique */}
                  {!loading &&
                    error &&
                    status === "idle" &&
                    !paymentConfirmed && (
                      <div className="flex items-start gap-2 rounded-lg p-3 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300/70 dark:ring-amber-800/60 text-amber-800 dark:text-amber-300">
                        <XCircle className="h-5 w-5 mt-0.5" />
                        <div>
                          <div className="font-medium">
                            Vérification du paiement impossible
                          </div>
                          <div className="text-sm">
                            {error}
                            <br />
                            Vous pouvez rafraîchir la page ou revenir plus tard
                            : votre formation restera accessible si le paiement
                            est bien validé.
                          </div>
                        </div>
                      </div>
                    )}

                  {!loading && !error && status && status !== "idle" && (
                    <div
                      className={[
                        "rounded-lg p-3 ring-1",
                        status === "succeeded"
                          ? "bg-emerald-50 dark:bg-emerald-900/10 ring-emerald-300/70 dark:ring-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                          : status === "requires_payment"
                            ? "bg-amber-50 dark:bg-amber-900/10 ring-amber-300/70 dark:ring-amber-800/60 text-amber-800 dark:text-amber-300"
                            : "bg-rose-50 dark:bg-rose-900/10 ring-rose-300/70 dark:ring-rose-800/60 text-rose-800 dark:text-rose-300",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        {status === "succeeded" ? (
                          <CheckCircle2 className="h-5 w-5 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium">{statusLabel}</div>
                          <div className="text-sm mt-0.5 space-y-0.5">
                            {amountLabel && <div>Montant : {amountLabel}</div>}
                            {paidAt && <div>Payé le {fmtDateTime(paidAt)}</div>}
                            {receiptUrl && (
                              <div className="inline-flex items-center gap-1">
                                Reçu :
                                <a
                                  href={receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 underline hover:no-underline"
                                >
                                  ouvrir
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {status === "succeeded" &&
                        (courseId || courseIdFromUrl) && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/communaute/courses/${encodeURIComponent(
                                    courseId || courseIdFromUrl,
                                  )}/learn`,
                                )
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Accéder à la formation{" "}
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historique des paiements */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-6">
              <h3 className="text-base font-semibold">
                Historique de paiements
              </h3>

              {ordersLoading && (
                <div className="mt-3 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de vos paiements…
                </div>
              )}

              {!ordersLoading && ordersError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg p-3 bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-300/70 dark:ring-rose-800/60 text-rose-700 dark:text-rose-300">
                  <XCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      Impossible de charger l’historique
                    </div>
                    <div className="text-sm">{ordersError}</div>
                  </div>
                </div>
              )}

              {!ordersLoading &&
                !ordersError &&
                Array.isArray(orders) &&
                orders.length === 0 && (
                  <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
                    Aucun paiement enregistré pour le moment.
                  </p>
                )}

              {!ordersLoading &&
                !ordersError &&
                Array.isArray(orders) &&
                orders.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {orders.map((o) => {
                      const s = o.status;
                      const colorClasses =
                        s === "succeeded"
                          ? "bg-emerald-50/70 dark:bg-emerald-900/10 ring-emerald-200/70 dark:ring-emerald-800/60"
                          : s === "requires_payment"
                            ? "bg-amber-50/70 dark:bg-amber-900/10 ring-amber-200/70 dark:ring-amber-800/60"
                            : "bg-rose-50/70 dark:bg-rose-900/10 ring-rose-200/70 dark:ring-rose-800/60";

                      const lbl =
                        s === "succeeded"
                          ? "Payé"
                          : s === "requires_payment"
                            ? "En attente"
                            : s === "failed"
                              ? "Échoué"
                              : "Annulé";

                      const amount = fmtMoney(
                        o.amounts.amount ?? null,
                        o.amounts.currency || "USD",
                      );

                      return (
                        <li
                          key={o.id}
                          className={`rounded-xl ring-1 ${colorClasses} p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {o.course?.title || "Cours"}
                            </div>
                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                              <div>
                                Statut :{" "}
                                <span className="font-medium">{lbl}</span>
                              </div>
                              <div>Montant : {amount || "—"}</div>
                              <div>
                                {o.paidAt
                                  ? `Payé le ${fmtDateTime(o.paidAt)}`
                                  : o.createdAt
                                    ? `Créé le ${fmtDateTime(o.createdAt)}`
                                    : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {o.receiptUrl && (
                              <a
                                href={o.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/60 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                              >
                                Reçu
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {o.course?.id && (
                              <Link
                                to={`/communaute/courses/${encodeURIComponent(
                                  o.course.id,
                                )}/learn`}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-600 hover:bg-violet-700 text-white"
                              >
                                Voir la formation
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>
          </>
        )}

        {activeTab === "courses" && (
          <>
            {/* Mes inscriptions */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-6">
              <h3 className="text-base font-semibold">Mes cours inscrits</h3>

              {enrollmentsLoading && (
                <div className="mt-3 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de vos cours…
                </div>
              )}

              {!enrollmentsLoading && enrollmentsError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg p-3 bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-300/70 dark:ring-rose-800/60 text-rose-700 dark:text-rose-300">
                  <XCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      Impossible de charger vos cours
                    </div>
                    <div className="text-sm">{enrollmentsError}</div>
                  </div>
                </div>
              )}

              {!enrollmentsLoading &&
                !enrollmentsError &&
                Array.isArray(enrollments) &&
                enrollments.length === 0 && (
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    Aucune inscription pour le moment.
                  </p>
                )}

              {!enrollmentsLoading &&
                !enrollmentsError &&
                Array.isArray(enrollments) &&
                enrollments.length > 0 && (
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {enrollments.map((it) => {
                      const c = it.course;
                      const priceLabel =
                        c.priceType === "paid"
                          ? fmtMoney(c.price ?? 0, c.currency)
                          : "Gratuit";
                      return (
                        <li
                          key={it.id}
                          className="rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900 overflow-hidden"
                        >
                          <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800">
                            {c.coverUrl ? (
                              <img
                                src={c.coverUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-semibold line-clamp-2">
                              {c.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {c.priceType === "paid" ? (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-black/10 dark:ring-white/10">
                                  Payant — {priceLabel}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-black/10 dark:ring-white/10">
                                  Gratuit
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Link
                                to={`/communaute/courses/${encodeURIComponent(
                                  c.id,
                                )}/learn`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs"
                              >
                                Continuer <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>
          </>
        )}

        {/* Lien de retour */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          <Link
            to="/communaute"
            className="underline underline-offset-2 hover:no-underline"
          >
            Retour aux communautés
          </Link>
        </div>
      </section>
    </div>
  );
}
