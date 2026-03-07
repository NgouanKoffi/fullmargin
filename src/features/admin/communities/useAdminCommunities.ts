// src/features/admin/communities/useAdminCommunities.ts
import { useState, useEffect, useCallback } from "react";
import type { TabKey, CommunityItem, CourseItem, Toast, ToastType } from "./types";
import {
  fetchCommunities,
  fetchDeletionRequests,
  fetchCourses,
  approveDeletion,
  approveRestoration,
  suspendItem,
  sendWarning,
} from "./communities.service";

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveId(c: CommunityItem): string {
  return c.id || String(c._id ?? "");
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useAdminCommunities() {
  const [tab, setTab] = useState<TabKey>("communities");
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minCount, setMinCount] = useState<number | "">("");
  const hasFilters = !!dateFrom || !!dateTo || minCount !== "";

  // ── Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { type, message, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Modal: suspend (with reason)
  const [suspendModal, setSuspendModal] = useState<{
    open: boolean;
    id: string;
    type: "Communauté" | "Formation";
    title: string;
    loading: boolean;
  }>({ open: false, id: "", type: "Communauté", title: "", loading: false });

  const openSuspendModal = useCallback((id: string, type: "Communauté" | "Formation", title: string) => {
    setSuspendModal({ open: true, id, type, title, loading: false });
  }, []);

  const closeSuspendModal = useCallback(() => {
    setSuspendModal((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

  const handleSuspendConfirm = useCallback(async (reason: string) => {
    setSuspendModal((prev) => ({ ...prev, loading: true }));
    try {
      const serviceType = suspendModal.type === "Communauté" ? "community" : "course";
      const data = await suspendItem(suspendModal.id, serviceType, reason);
      if (data.ok) {
        setSuspendModal({ open: false, id: "", type: "Communauté", title: "", loading: false });
        addToast("success", `${suspendModal.type} suspendue avec succès.`);
        void fetchData();
      } else {
        addToast("error", data.error || "Erreur lors de la suspension.");
        setSuspendModal((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      addToast("error", "Erreur réseau. Veuillez réessayer.");
      setSuspendModal((prev) => ({ ...prev, loading: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspendModal, addToast]);

  // ── Modal: warning
  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    id: string;
    title: string;
    loading: boolean;
  }>({ open: false, id: "", title: "", loading: false });

  const openWarningModal = useCallback((id: string, title: string) => {
    setWarningModal({ open: true, id, title, loading: false });
  }, []);

  const closeWarningModal = useCallback(() => {
    setWarningModal((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

  const handleWarningConfirm = useCallback(async (reason: string) => {
    setWarningModal((prev) => ({ ...prev, loading: true }));
    try {
      const data = await sendWarning(warningModal.id, reason);
      if (data.ok) {
        setWarningModal({ open: false, id: "", title: "", loading: false });
        addToast("success", data.message || "Avertissement envoyé.");
        void fetchData();
      } else {
        addToast("error", data.error || "Erreur lors de l'avertissement.");
        setWarningModal((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      addToast("error", "Erreur réseau. Veuillez réessayer.");
      setWarningModal((prev) => ({ ...prev, loading: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warningModal, addToast]);

  // ── Modal: approve deletion
  const [approveDeletionModal, setApproveDeletionModal] = useState<{
    open: boolean;
    community: CommunityItem | null;
    loading: boolean;
  }>({ open: false, community: null, loading: false });

  const handleApproveDeletion = useCallback(async () => {
    const c = approveDeletionModal.community;
    if (!c) return;
    const id = resolveId(c);
    if (!id) { addToast("error", "Identifiant introuvable."); return; }

    setApproveDeletionModal((prev) => ({ ...prev, loading: true }));
    try {
      const data = await approveDeletion(id);
      if (data.ok) {
        setApproveDeletionModal({ open: false, community: null, loading: false });
        addToast("success", data.message || "Suppression approuvée.");
        void fetchData();
      } else {
        addToast("error", data.error || "Erreur lors de l'approbation.");
        setApproveDeletionModal((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      addToast("error", "Erreur réseau.");
      setApproveDeletionModal((prev) => ({ ...prev, loading: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveDeletionModal, addToast]);

  // ── Modal: approve restoration
  const [approveRestorationModal, setApproveRestorationModal] = useState<{
    open: boolean;
    community: CommunityItem | null;
    loading: boolean;
  }>({ open: false, community: null, loading: false });

  const handleApproveRestoration = useCallback(async () => {
    const c = approveRestorationModal.community;
    if (!c) return;
    const id = resolveId(c);
    if (!id) { addToast("error", "Identifiant introuvable."); return; }

    setApproveRestorationModal((prev) => ({ ...prev, loading: true }));
    try {
      const data = await approveRestoration(id);
      if (data.ok) {
        setApproveRestorationModal({ open: false, community: null, loading: false });
        addToast("success", data.message || "Restauration approuvée.");
        void fetchData();
      } else {
        addToast("error", data.error || "Erreur lors de la restauration.");
        setApproveRestorationModal((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      addToast("error", "Erreur réseau.");
      setApproveRestorationModal((prev) => ({ ...prev, loading: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveRestorationModal, addToast]);

  // ── Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "communities") {
        setCommunities(await fetchCommunities());
      } else if (tab === "requests") {
        setCommunities(await fetchDeletionRequests());
      } else if (tab === "courses") {
        setCourses(await fetchCourses());
      }
    } catch {
      addToast("error", "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, [tab, addToast]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Computed / filtered
  const filterItem = (date: string, name: string, count: number) => {
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const d = new Date(date).getTime();
    if (dateFrom && d < new Date(dateFrom).getTime()) return false;
    if (dateTo && d > new Date(dateTo).setHours(23, 59, 59, 999)) return false;
    if (minCount !== "" && count < Number(minCount)) return false;
    return true;
  };

  const filteredCommunities = communities.filter((c) =>
    filterItem(c.createdAt || new Date().toISOString(), c.name, c.membersCount || 0)
  );
  const filteredCourses = courses.filter((c) =>
    filterItem(c.createdAt, c.title, c.enrollmentCount || 0)
  );

  return {
    // Tab
    tab, setTab,
    // Loading
    loading,
    // Lists
    filteredCommunities, filteredCourses,
    // Filters
    searchQuery, setSearchQuery,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    minCount, setMinCount,
    hasFilters,
    clearFilters: () => { setDateFrom(""); setDateTo(""); setMinCount(""); setSearchQuery(""); },
    // Toasts
    toasts, addToast, removeToast,
    // Suspend modal
    suspendModal, openSuspendModal, closeSuspendModal, handleSuspendConfirm,
    // Warning modal
    warningModal, openWarningModal, closeWarningModal, handleWarningConfirm,
    // Approve deletion modal
    approveDeletionModal, setApproveDeletionModal, handleApproveDeletion,
    // Approve restoration modal
    approveRestorationModal, setApproveRestorationModal, handleApproveRestoration,
  };
}
