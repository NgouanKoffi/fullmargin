// src/pages/admin/fullmetrix/components/FmMetrixNotifications.tsx
import { useEffect, useState } from "react";
import { CheckCircle, Info, XCircle, Bell, CheckCheck } from "lucide-react";
import { api } from "../../../../lib/api";

type FmNotif = {
  id: string;
  kind: string;
  seen: boolean;
  createdAt: string;
  title: string;
  message: string;
};

type RawNotification = {
  id: string;
  kind: string;
  seen: boolean;
  createdAt: string;
  payload?: {
    title?: string;
    message?: string;
    feature?: string;
    [key: string]: unknown;
  };
};

export default function FmMetrixNotifications() {
  const [notifs, setNotifs] = useState<FmNotif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        ok: boolean;
        data: { items: RawNotification[] };
      }>("/notifications?limit=20");

      if (res.ok && Array.isArray(res.data?.items)) {
        const filtered = res.data.items
          .filter(
            (n) =>
              n.kind.startsWith("fmmetrix.") ||
              n.payload?.feature === "fm-metrix",
          )
          .map((n) => ({
            id: n.id,
            kind: n.kind,
            seen: n.seen,
            createdAt: n.createdAt,
            title: n.payload?.title || "Notification FM Metrix",
            message: n.payload?.message || "",
          }));
        setNotifs(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsSeen = async (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, seen: true } : n)),
    );
    try {
      await api.post("/notifications/mark-seen", { ids: [id] });
    } catch (e) {
      console.warn("Impossible de marquer comme lu", e);
    }
  };

  const markAllSeen = async () => {
    const unreadIds = notifs.filter((n) => !n.seen).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic UI update
    setNotifs((prev) => prev.map((n) => ({ ...n, seen: true })));

    try {
      await api.post("/notifications/mark-seen", { ids: unreadIds });
    } catch (e) {
      console.warn("Erreur lors du marquage global", e);
    }
  };

  const getIcon = (kind: string) => {
    if (
      kind.includes("success") ||
      kind.includes("activated") ||
      kind.includes("grant")
    ) {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    if (kind.includes("renewed")) {
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
    if (kind.includes("canceled") || kind.includes("rejected")) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Info className="w-5 h-5 text-slate-500" />;
  };

  const hasUnread = notifs.some((n) => !n.seen);

  if (loading)
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        Chargement des notifications...
      </div>
    );

  if (notifs.length === 0) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <Bell className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Aucune activité récente
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Vos notifications de paiement apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-500" />
          Dernières activités
        </h3>

        {hasUnread && (
          <button
            onClick={markAllSeen}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition"
            title="Tout marquer comme lu"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              if (!n.seen) void markAsSeen(n.id);
            }}
            className={`group px-6 py-4 flex gap-4 transition cursor-pointer ${
              !n.seen
                ? "bg-violet-50/40 dark:bg-violet-900/10 hover:bg-violet-50/60 dark:hover:bg-violet-900/20"
                : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
            }`}
          >
            <div className="shrink-0 mt-0.5">{getIcon(n.kind)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p
                  className={`text-sm font-medium truncate pr-2 ${
                    !n.seen
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {n.title}
                </p>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p
                className={`text-xs mt-1 line-clamp-2 ${
                  !n.seen
                    ? "text-slate-600 dark:text-slate-300"
                    : "text-slate-500 dark:text-slate-500"
                }`}
              >
                {n.message}
              </p>
            </div>
            <div className="shrink-0 flex items-center">
              {!n.seen && (
                <div className="w-2 h-2 rounded-full bg-violet-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
