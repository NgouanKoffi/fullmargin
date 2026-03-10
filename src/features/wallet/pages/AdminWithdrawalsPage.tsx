// src/pages/wallet/AdminWithdrawalsPage.tsx
import clsx from "clsx";
import { RefreshCcw } from "lucide-react";
import { DetailsModal } from "../components/common/DetailsModal";
import type { UnifiedWithdrawal } from "../components/common/types";
import { TABS } from "../components/admin/types";
import { useAdminWithdrawals } from "../hooks/useAdminWithdrawals";
import { WithdrawalsTable } from "../components/admin/WithdrawalsTable";
import { ValidateModal } from "../components/admin/ValidateModal";
import { RejectModal } from "../components/admin/RejectModal";

export default function AdminWithdrawalsPage() {
  const {
    activeTab,
    setActiveTab,
    items,
    loading,
    q,
    setQ,
    refreshAction,
    viewingItem,
    setViewingItem,
    validatingId,
    setValidatingId,
    rejectingId,
    setRejectingId,
    handleValidate,
    handleReject,
  } = useAdminWithdrawals();

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
            onClick={refreshAction}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition"
          >
            <RefreshCcw
              className={clsx("w-5 h-5 text-slate-500", loading && "animate-spin")}
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
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <WithdrawalsTable
        items={items}
        loading={loading}
        onViewItem={setViewingItem}
        onValidate={setValidatingId}
        onReject={setRejectingId}
      />

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
