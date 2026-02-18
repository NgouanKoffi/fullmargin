// src/pages/admin/marketplaceCrypto/components/PaymentsHistoryTable.tsx
import type { MarketplaceCryptoAdminItem } from "../types";

type Props = {
  items: MarketplaceCryptoAdminItem[];
};

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();

  if (s.includes("paid") || s.includes("approved")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        Validé
      </span>
    );
  }
  if (s.includes("rejected") || s.includes("cancel")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
        Rejeté
      </span>
    );
  }
  if (s.includes("expired")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        Expiré
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      {status || "—"}
    </span>
  );
}

export default function PaymentsHistoryTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-500">Aucun historique.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-medium">Utilisateur</th>
            <th className="px-6 py-4 font-medium">Produit</th>
            <th className="px-6 py-4 font-medium">Statut</th>
            <th className="px-6 py-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it) => (
            <tr key={it.id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">{it.userName}</div>
                <div className="text-xs text-slate-500">{it.userEmail}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">
                  {it.productName || "—"}
                </div>
                <div className="text-xs text-slate-500">
                  Provider : {it.provider || "—"}
                </div>
              </td>
              <td className="px-6 py-4">{statusBadge(it.status)}</td>
              <td className="px-6 py-4 text-xs text-slate-600">
                {formatDate(it.updatedAt || it.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
