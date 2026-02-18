// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\wallet\AdminWithdrawalsPage.tsx
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  XCircle,
  RefreshCcw,
  BadgeDollarSign,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../lib/api";

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
  paymentDetails: {
    cryptoAddress?: string;
    bankName?: string;
    bankIban?: string;
    bankSwift?: string;
    bankCountry?: string;
  };
  rejectionReason?: string;
  payoutRef?: string;
  proof?: string;
};

type AdminListResponse =
  | { ok: true; data: { items: WItem[] } }
  | { ok: false; error?: string };

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

  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [payoutRef, setPayoutRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const currentTab = TABS.find((t) => t.id === activeTab);
        const statusParam = currentTab?.statuses.join(",") || "PENDING";
        const res = (await api.get(
          `/admin/withdrawals?status=${statusParam}&q=${q}`,
        )) as AdminListResponse;
        if (res.ok) setItems(res.data.items || []);
        else setItems([]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [activeTab, q, refreshKey]);

  const handleValidate = async () => {
    if (!validatingId) return;
    
    let proofUrl = "";
    
    // Upload proof file if provided
    if (proofFile) {
      try {
        const formData = new FormData();
        formData.append("proof", proofFile);
        
        const uploadRes = await api.post(
          `/admin/withdrawals/${validatingId}/upload-proof`,
          undefined, // no json body
          { body: formData } // FormData goes in body
        ) as { ok: boolean; data?: { proofUrl: string }; error?: string };
        
        if (uploadRes.ok && uploadRes.data) {
          proofUrl = uploadRes.data.proofUrl;
        } else {
          alert("Erreur lors de l'upload du fichier");
          return;
        }
      } catch (e) {
        console.error(e);
        alert("Erreur lors de l'upload du fichier");
        return;
      }
    }
    
    // Mark as paid with proof URL
    try {
      await api.post(`/admin/withdrawals/${validatingId}/mark-paid`, {
        payoutRef: payoutRef || "Validé",
        proof: proofUrl,
      });
      
      setValidatingId(null);
      setPayoutRef("");
      setProofFile(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erreur validation");
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await api.post(`/admin/withdrawals/${rejectingId}/reject`, {
        reason: rejectReason,
      });
      setRejectingId(null);
      setRejectReason("");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erreur rejet");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Retraits</h1>
        </div>
        <div className="flex gap-2">
          <input
            className="pl-4 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
            placeholder="Recherche..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCcw
              className={clsx("w-5 h-5", loading && "animate-spin")}
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
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4 font-mono font-bold">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4">{item.user?.name}</td>
                  <td className="px-6 py-4 font-bold text-violet-600">
                    {item.amountNet.toFixed(2)} USD
                  </td>
                  <td className="px-6 py-4">{item.method}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setValidatingId(item.id);
                            setPayoutRef("");
                            setProofFile(null);
                          }}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                          title="Valider & Payer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(item.id);
                            setRejectReason("");
                          }}
                          className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200"
                          title="Rejeter"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {validatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-emerald-600" /> Valider
              le paiement
            </h3>
            <div className="space-y-4">
              <input
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent outline-none"
                placeholder="Réf transaction (facultatif)"
              />
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={clsx(
                    "border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center",
                    proofFile && "border-emerald-500 bg-emerald-50",
                  )}
                >
                  {proofFile ? (
                    <span className="text-emerald-700">{proofFile.name}</span>
                  ) : (
                    <span className="text-slate-500">
                      Ajouter une preuve (Image/PDF)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setValidatingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleValidate}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Rejeter la demande
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent outline-none h-24 resize-none"
              placeholder="Motif..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    VALIDATED: "bg-blue-100 text-blue-700",
    PAID: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
    FAILED: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={clsx(
        "px-2.5 py-0.5 rounded-full text-xs font-bold",
        styles[status] || styles.FAILED,
      )}
    >
      {status}
    </span>
  );
}
