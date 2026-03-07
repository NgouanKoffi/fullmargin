import { useState, useEffect } from "react";
import { api } from "@core/api/client";
import { TABS } from "../components/admin/types";
import type { WItem } from "../components/admin/types";

export function useAdminWithdrawals() {
  const [activeTab, setActiveTab] = useState("pending");
  const [items, setItems] = useState<WItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingItem, setViewingItem] = useState<WItem | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchList = async () => {
      setLoading(true);
      try {
        const currentTab = TABS.find((t) => t.id === activeTab);
        if (!currentTab) return;

        const promises = currentTab.statuses.map((st) =>
          api.get(`/admin/withdrawals?status=${st}&q=${q}`),
        );
        const results = await Promise.all(promises);

        if (cancelled) return;

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

        if (!cancelled) setItems(uniqueItems);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchList();

    return () => {
      cancelled = true;
    };
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

  const refreshAction = () => setRefreshKey((k) => k + 1);

  return {
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
  };
}
