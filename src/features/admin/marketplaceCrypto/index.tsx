// src/pages/admin/marketplaceCrypto/index.tsx
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  Clock,
  RefreshCcw,
  Search,
  XCircle,
  Check,
  Ban,
  Loader2,
} from "lucide-react";

import { api } from "@core/api/client";

type UserObj = { _id?: string; id?: string; email?: string; name?: string };
type UserLite = string | UserObj | null;

type OrderItem = {
  product: string;
  title: string;
  unitAmount: number;
  qty: number;
  seller?: string;
  shop?: string | null;
};

type OrderStatus =
  | "requires_payment"
  | "succeeded"
  | "canceled"
  | "failed"
  | "processing";

type OrderRow = {
  _id?: string;
  id?: string;
  user: UserLite;
  status: OrderStatus;
  currency: string;
  totalAmount: number;
  totalAmountCents?: number;
  createdAt: string | Date;
  paidAt: string | Date | null;
  items: OrderItem[];
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type OrdersPayload = { items: OrderRow[] };

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v && String(v).trim()) qs.set(k, String(v).trim());
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

function getErrMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  return "Erreur inconnue";
}

function fmtDate(v: string | Date) {
  try {
    const d = v instanceof Date ? v : new Date(v);
    return d.toLocaleString();
  } catch {
    return String(v || "");
  }
}

function fmtMoney(n: number, cur: string) {
  const v = Number(n || 0);
  const c = String(cur || "USD").toUpperCase();
  return `${v.toFixed(2)} ${c}`;
}

function getId(o: OrderRow) {
  return String(o._id || o.id || "");
}
function shortId(id: string) {
  const s = String(id || "");
  return s.length >= 8 ? s.slice(-8).toUpperCase() : s.toUpperCase();
}

function statusBadge(status: OrderStatus) {
  switch (status) {
    case "requires_payment":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40";
    case "succeeded":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40";
    case "processing":
      return "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-900/40";
    case "canceled":
      return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-100 dark:border-slate-700";
    case "failed":
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/40";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-100 dark:border-slate-700";
  }
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "requires_payment":
      return "En attente";
    case "succeeded":
      return "Payée";
    case "processing":
      return "Processing";
    case "canceled":
      return "Annulée";
    case "failed":
      return "Échouée";
    default:
      return status;
  }
}

function extractBuyer(u: UserLite) {
  if (!u) return "—";
  if (typeof u === "string") return u;
  return u.email || u.name || u._id || u.id || "—";
}

async function apiGet<T>(path: string) {
  return (await api.get(path)) as ApiEnvelope<T>;
}
async function apiPost<T>(path: string, body?: unknown) {
  return (await (api as any).post(path, {
    json: body ?? {},
  })) as ApiEnvelope<T>;
}

async function fetchList(path: string, q?: string) {
  const url = buildUrl(path, { q: q?.trim() || undefined });
  const res = await apiGet<OrdersPayload>(url);
  if (!res.ok) throw new Error(res.error || "Not found");
  return res.data?.items ?? [];
}

export default function AdminMarketplaceCryptoPage() {
  const [tab, setTab] = useState<"pending" | "paid" | "closed">("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pending, setPending] = useState<OrderRow[]>([]);
  const [paid, setPaid] = useState<OrderRow[]>([]);
  const [closed, setClosed] = useState<OrderRow[]>([]);

  // ÉTATS POUR LES MODALES
  const [modal, setModal] = useState<{
    open: boolean;
    type: "validate" | "reject";
    orderId: string | null;
  }>({ open: false, type: "validate", orderId: null });
  const [rejectReason, setRejectReason] = useState(
    "Nous n'avons pas reçu les fonds.",
  );
  const [actionBusy, setActionBusy] = useState(false);

  const activeList = useMemo(() => {
    const list = tab === "pending" ? pending : tab === "paid" ? paid : closed;
    const s = q.trim().toLowerCase();
    if (!s) return list;

    return list.filter((o) => {
      const id = getId(o).toLowerCase();
      const last8 = shortId(getId(o)).toLowerCase();
      const buyer = extractBuyer(o.user).toLowerCase();
      const titles = (o.items || [])
        .map((it) => String(it.title || "").toLowerCase())
        .join(" ");

      const isLast8Search = s.length === 8 && last8 === s;

      return (
        id.includes(s) ||
        buyer.includes(s) ||
        titles.includes(s) ||
        isLast8Search
      );
    });
  }, [tab, pending, paid, closed, q]);

  async function loadAll(search = "") {
    setLoading(true);
    setErr(null);
    try {
      const [a, b, c] = await Promise.all([
        fetchList("/admin/marketplace/orders/pending", search),
        fetchList("/admin/marketplace/orders/paid", search),
        fetchList("/admin/marketplace/orders/closed", search),
      ]);
      setPending(a);
      setPaid(b);
      setClosed(c);
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll("");
  }, []);

  async function handleValidate(orderId: string) {
    setActionBusy(true);
    setErr(null);
    try {
      // ✅ RETOUR À LA ROUTE /validate ORIGINALE
      const res = await apiPost<{ order: OrderRow }>(
        `/admin/marketplace/orders/${orderId}/validate`,
        {},
      );
      if (!res.ok) throw new Error(res.error || "Action impossible");

      setPending((prev) => prev.filter((x) => getId(x) !== orderId));
      setPaid((prev) => [
        { ...(res.data?.order || {}), status: "succeeded" } as OrderRow,
        ...prev,
      ]);
      setTab("paid");
      closeModal();
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(orderId: string, reason: string) {
    setActionBusy(true);
    setErr(null);
    try {
      // ✅ RETOUR À LA ROUTE /cancel ORIGINALE avec le motif
      const res = await apiPost<{ order: OrderRow }>(
        `/admin/marketplace/orders/${orderId}/cancel`,
        { reason },
      );
      if (!res.ok) throw new Error(res.error || "Action impossible");

      setPending((prev) => prev.filter((x) => getId(x) !== orderId));
      setClosed((prev) => [
        { ...(res.data?.order || {}), status: "failed" } as OrderRow,
        ...prev,
      ]);
      setTab("closed");
      closeModal();
    } catch (e: unknown) {
      setErr(getErrMsg(e));
    } finally {
      setActionBusy(false);
    }
  }

  const openValidateModal = (id: string) =>
    setModal({ open: true, type: "validate", orderId: id });
  const openRejectModal = (id: string) => {
    setRejectReason("Nous n'avons pas reçu les fonds.");
    setModal({ open: true, type: "reject", orderId: id });
  };
  const closeModal = () =>
    setModal({ open: false, type: "validate", orderId: null });

  return (
    <div className="p-4 md:p-6 text-slate-900 dark:text-slate-100 relative">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Marketplace — Commandes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            En attente (requires_payment), Payées (succeeded), Annulées/Échouées
            (canceled/failed)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadAll(q);
              }}
              placeholder="Rechercher (email, id, produit...)"
              className="h-9 w-[320px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none
                         focus:border-slate-300
                         dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-700"
            />
          </div>

          <button
            onClick={() => loadAll(q)}
            disabled={loading}
            className={clsx(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm",
              "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
              "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
              loading && "opacity-60",
            )}
            title="Recharger depuis l'API"
          >
            <RefreshCcw
              className={clsx("h-4 w-4", loading && "animate-spin")}
            />
            Recharger
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("pending")}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
            tab === "pending"
              ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900",
          )}
        >
          <Clock className="h-4 w-4" />
          En attente
          <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs dark:bg-slate-800/60">
            {pending.length}
          </span>
        </button>

        <button
          onClick={() => setTab("paid")}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
            tab === "paid"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Payées
          <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs dark:bg-slate-800/60">
            {paid.length}
          </span>
        </button>

        <button
          onClick={() => setTab("closed")}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
            tab === "closed"
              ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900",
          )}
        >
          <XCircle className="h-4 w-4" />
          Annulées / Échouées
          <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs dark:bg-slate-800/60">
            {closed.length}
          </span>
        </button>
      </div>

      {err && (
        <div
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700
                        dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
        >
          {err}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {loading ? "Chargement..." : `${activeList.length} commande(s)`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Commande</th>
                <th className="px-4 py-3 text-left">Acheteur</th>
                <th className="px-4 py-3 text-left">Articles</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-slate-800 dark:text-slate-100">
              {!loading && activeList.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                    colSpan={7}
                  >
                    Aucune commande dans cet onglet.
                  </td>
                </tr>
              )}

              {activeList.map((o) => {
                const id = getId(o);
                const sid = shortId(id);
                const buyer = extractBuyer(o.user);
                const items = Array.isArray(o.items) ? o.items : [];
                const preview = items
                  .slice(0, 2)
                  .map((it) => it.title)
                  .join(", ");
                const more = items.length > 2 ? ` +${items.length - 2}` : "";

                const isPending = o.status === "requires_payment";

                return (
                  <tr
                    key={id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 dark:border-slate-900 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-3">{fmtDate(o.createdAt)}</td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-xs" title={id}>
                        #{sid}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {id}
                      </div>
                    </td>

                    <td className="px-4 py-3">{buyer}</td>

                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-slate-100">
                        {preview || "—"}
                      </div>
                      {more && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {more}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      {fmtMoney(o.totalAmount, o.currency)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                          statusBadge(o.status),
                        )}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {tab === "pending" && isPending ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openValidateModal(id)}
                            className={clsx(
                              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                              "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                              "dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-900/30",
                            )}
                            title="Valider la commande"
                          >
                            <Check className="h-4 w-4" />
                            Valider
                          </button>

                          <button
                            onClick={() => openRejectModal(id)}
                            className={clsx(
                              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                              "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
                              "dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30",
                            )}
                            title="Refuser la commande"
                          >
                            <Ban className="h-4 w-4" />
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ BELLES MODALES INTEGREES */}
      {modal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-white/10">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {modal.type === "validate" ? (
                <>
                  <CheckCircle2 className="text-emerald-600 w-6 h-6" />{" "}
                  Confirmer la validation
                </>
              ) : (
                <>
                  <XCircle className="text-rose-600 w-6 h-6" /> Refuser la
                  commande
                </>
              )}
            </h3>

            {modal.type === "validate" ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Avez-vous bien reçu les fonds ? En validant, la commande sera
                marquée comme payée et les produits seront immédiatement livrés
                au client.
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Précisez le motif du refus. Ce message sera envoyé au client
                  par notification.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  rows={3}
                  placeholder="Motif du refus..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={closeModal}
                disabled={actionBusy}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (modal.orderId) {
                    if (modal.type === "validate")
                      handleValidate(modal.orderId);
                    else handleReject(modal.orderId, rejectReason);
                  }
                }}
                disabled={
                  actionBusy ||
                  (modal.type === "reject" && !rejectReason.trim())
                }
                className={clsx(
                  "rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm flex items-center gap-2 disabled:opacity-50",
                  modal.type === "validate"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {actionBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal.type === "validate"
                  ? "Oui, valider les fonds"
                  : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
