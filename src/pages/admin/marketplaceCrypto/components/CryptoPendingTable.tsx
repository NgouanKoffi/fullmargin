// src/pages/admin/marketplaceCrypto/components/CryptoPendingTable.tsx
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Copy } from "lucide-react";
import { api } from "../../../../lib/api";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/Notification";
import type { MarketplaceCryptoAdminItem } from "../types";

type Props = {
  items: MarketplaceCryptoAdminItem[];
  onRefresh: () => void;
};

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function CryptoPendingTable({ items, onRefresh }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });
  }, [items]);

  async function approve(item: MarketplaceCryptoAdminItem) {
    if (!window.confirm("Valider ce paiement crypto ?")) return;

    try {
      setBusyId(item.id);

      // ✅ Endpoints proposés (tu peux les aligner côté backend)
      await api.post("/payments/admin/marketplace/crypto/approve", {
        paymentId: item.id,
        cryptoRef: item.cryptoRef ?? null,
      });

      notifySuccess("Paiement crypto validé.");
      onRefresh();
    } catch (e) {
      console.error(e);
      notifyError("Impossible de valider le paiement.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(item: MarketplaceCryptoAdminItem) {
    const reason = window.prompt("Raison du rejet (optionnel) :") ?? "";
    if (!window.confirm("Rejeter ce paiement crypto ?")) return;

    try {
      setBusyId(item.id);

      await api.post("/payments/admin/marketplace/crypto/reject", {
        paymentId: item.id,
        reason: reason.trim() || null,
      });

      notifySuccess("Paiement crypto rejeté.");
      onRefresh();
    } catch (e) {
      console.error(e);
      notifyError("Impossible de rejeter le paiement.");
    } finally {
      setBusyId(null);
    }
  }

  function copy(v: string) {
    void navigator.clipboard.writeText(v);
    notifySuccess("Copié.");
  }

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-500">Aucune validation crypto en attente.</p>
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
            <th className="px-6 py-4 font-medium">Montant</th>
            <th className="px-6 py-4 font-medium">Référence crypto</th>
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {sorted.map((it) => {
            const busy = busyId === it.id;
            const ref = (it.cryptoRef || "").trim();

            return (
              <tr key={it.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {it.userName}
                  </div>
                  <div className="text-xs text-slate-500">{it.userEmail}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-slate-900 font-medium">
                    {it.productName || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Provider : {it.provider || "—"}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">
                    {money(it.amount, it.currency)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {it.cryptoCurrency ? `Crypto: ${it.cryptoCurrency}` : null}
                    {it.cryptoNetwork ? ` • Réseau: ${it.cryptoNetwork}` : null}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {ref ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        {ref.slice(0, 10)}…{ref.slice(-8)}
                      </code>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Copier"
                        onClick={() => copy(ref)}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="px-6 py-4 text-xs text-slate-600">
                  {formatDate(it.createdAt)}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => approve(it)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-60"
                      title="Valider"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Valider
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => reject(it)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 disabled:opacity-60"
                      title="Rejeter"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
