// src/pages/wallet/AdminWithdrawalsPage.tsx
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  XCircle,
  RefreshCcw,
  BadgeDollarSign,
  AlertTriangle,
  Eye,
  Building2,
  Bitcoin,
  X,
} from "lucide-react";
import { api } from "@core/api/client";
import {
  StatusBadge,
  ModalWrapper,
  DetailsModal,
  type UnifiedWithdrawal,
} from "./components/SharedWithdrawalModals";

type WItem = {
  id: string;
  reference: string;
  currency?: string;
  amountGross: number;
  commission: number;
  amountNet: number;
  method: "USDT" | "BTC" | "BANK";
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED" | "FAILED";
  createdAt: string;
  user: { email: string; name: string } | null;
  paymentDetails: any;
  rejectionReason?: string;
  payoutRef?: string;
  proof?: string;
  failureReason?: string;
};

const TABS = [
  { id: "pending", label: "En attente", statuses: ["PENDING"] },
  { id: "paid", label: "Validés / Payés", statuses: ["VALIDATED", "PAID"] },
  {
    id: "rejected",
    label: "Rejetés / Echecs",
    statuses: ["REJECTED", "FAILED"],
  },
];

export default function AdminWithdrawalsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [items, setItems] = useState<WItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingItem, setViewingItem] = useState<WItem | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const currentTab = TABS.find((t) => t.id === activeTab);
        if (!currentTab) return;

        const promises = currentTab.statuses.map((st) =>
          api.get(`/admin/withdrawals?status=${st}&q=${q}`),
        );
        const results = await Promise.all(promises);

        const combinedItems: WItem[] = [];
        results.forEach((res: any) => {
          if (res.ok && res.data?.items) combinedItems.push(...res.data.items);
        });

        const uniqueItems = Array.from(
          new Map(combinedItems.map((item) => [item.id, item])).values(),
        );
        uniqueItems.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setItems(uniqueItems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [activeTab, q, refreshKey]);

  const handleValidate = async (id: string, ref: string, file: File | null) => {
    let proofUrl = "";
    if (file) {
      const formData = new FormData();
      formData.append("proof", file);
      const res: any = await api.post(
        `/admin/withdrawals/${id}/upload-proof`,
        undefined,
        { body: formData },
      );
      if (res.ok && res.data) proofUrl = res.data.proofUrl;
      else return alert("Erreur lors de l'upload du fichier");
    }
    try {
      await api.post(`/admin/withdrawals/${id}/mark-paid`, {
        payoutRef: ref || "Validé",
        proof: proofUrl,
      });
      setValidatingId(null);
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Erreur validation");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      setRejectingId(null);
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Erreur rejet");
    }
  };

  // Convertisseur pour le Modal Partagé
  const unifiedViewingItem: UnifiedWithdrawal | null = viewingItem
    ? {
        id: viewingItem.id,
        reference: viewingItem.reference,
        date: viewingItem.createdAt,
        amountNet: viewingItem.amountNet,
        method: viewingItem.method,
        status: viewingItem.status,
        user: viewingItem.user,
        paymentDetails: viewingItem.paymentDetails,
        rejectionReason: viewingItem.rejectionReason,
        failureReason: viewingItem.failureReason,
        payoutRef: viewingItem.payoutRef,
        proof: viewingItem.proof,
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gestion des Retraits</h1>
        <div className="flex gap-2">
          <input
            className="pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="Rechercher (Email, Réf...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition"
          >
            <RefreshCcw
              className={clsx(
                "w-5 h-5 text-slate-500",
                loading && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Réf</th>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Net</th>
                <th className="px-6 py-4">Méthode</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{item.user?.name}</div>
                    <div className="text-xs text-slate-500">
                      {item.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-violet-600 dark:text-violet-400">
                    {item.amountNet.toFixed(2)} $
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className="flex items-center gap-1.5">
                      {item.method === "BANK" ? (
                        <Building2 className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Bitcoin className="w-4 h-4 text-amber-500" />
                      )}
                      {item.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingItem(item)}
                        className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => setValidatingId(item.id)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition"
                            title="Valider & Payer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectingId(item.id)}
                            className="p-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition"
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Aucun retrait trouvé dans cette catégorie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unifiedViewingItem && (
        <DetailsModal
          item={unifiedViewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
      {validatingId && (
        <ValidateModal
          itemId={validatingId}
          onClose={() => setValidatingId(null)}
          onConfirm={handleValidate}
        />
      )}
      {rejectingId && (
        <RejectModal
          itemId={rejectingId}
          onClose={() => setRejectingId(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

// Composants Modals Spécifiques Admin
function ValidateModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: (id: string, ref: string, file: File | null) => void;
}) {
  const [payoutRef, setPayoutRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
          <BadgeDollarSign className="w-5 h-5" /> Valider le paiement
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Référence transaction (Facultatif)
          </label>
          <input
            value={payoutRef}
            onChange={(e) => setPayoutRef(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Ex: TXN-987654321"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Preuve de paiement
          </label>
          <div className="relative group">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className={clsx(
                "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors",
                proofFile
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 group-hover:border-emerald-400",
              )}
            >
              {proofFile ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {proofFile.name}
                </span>
              ) : (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cliquez ou glissez une image / PDF ici
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
        >
          Annuler
        </button>
        <button
          onClick={() => onConfirm(itemId, payoutRef, proofFile)}
          className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
        >
          Confirmer le paiement
        </button>
      </div>
    </ModalWrapper>
  );
}

function RejectModal({
  itemId,
  onClose,
  onConfirm,
}: {
  itemId: string;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-900/10 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" /> Rejeter la demande
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Motif du rejet (Envoyé au client)
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-rose-500/20 min-h-[120px] resize-none"
          placeholder="Ex: L'adresse crypto est invalide..."
        />
      </div>
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
        >
          Annuler
        </button>
        <button
          onClick={() => onConfirm(itemId, rejectReason)}
          disabled={!rejectReason.trim()}
          className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
        >
          Rejeter définitivement
        </button>
      </div>
    </ModalWrapper>
  );
}
