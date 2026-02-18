// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\components\ActiveSubscriptionsTable.tsx
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Trash2, XCircle, AlertTriangle, Loader2, History } from "lucide-react";
import type { FmMetrixAdminItem } from "../types";
import { api } from "../../../../lib/api";
import {
  notifySuccess,
  notifyError,
} from "../../../../components/Notification";
import UserHistoryModal from "../UserHistoryModal";

// --- MODAL DE CONFIRMATION DE SUPPRESSION ---
type DeleteModalProps = {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function DeleteConfirmModal({ onClose, onConfirm, loading }: DeleteModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Révoquer tous les accès ?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Voulez-vous vraiment supprimer cet utilisateur et <b>tout</b> son
              historique d&apos;abonnement ? Il perdra l&apos;accès
              immédiatement.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Révoquer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// --- LOGIQUE DE GROUPEMENT ---

type GroupedUser = {
  userId: string;
  email: string;
  name: string;
  items: FmMetrixAdminItem[]; // Tout l'historique
  latestItem: FmMetrixAdminItem; // Le plus récent pour affichage
  isActive: boolean;
};

type Props = {
  items: FmMetrixAdminItem[];
  onRefresh: () => void;
  loading: boolean;
};

export default function ActiveSubscriptionsTable({
  items,
  onRefresh,
  loading,
}: Props) {
  const [historyUser, setHistoryUser] = useState<GroupedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Groupement des données par email
  const groupedUsers: GroupedUser[] = useMemo(() => {
    const map = new Map<string, FmMetrixAdminItem[]>();

    // 1. Regrouper
    items.forEach((item) => {
      const key = item.userEmail || item.userId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });

    // 2. Transformer en tableau d'objets structurés
    const result: GroupedUser[] = [];
    map.forEach((userItems) => {
      userItems.sort((a, b) => {
        return (
          new Date(b.periodEnd || 0).getTime() -
          new Date(a.periodEnd || 0).getTime()
        );
      });

      const latest = userItems[0];
      const hasActive = userItems.some(
        (it) =>
          it.status !== "expired" &&
          it.periodEnd &&
          new Date(it.periodEnd) > new Date(),
      );

      result.push({
        userId: latest.userId,
        email: latest.userEmail || "No Email",
        name: latest.userName || "No Name",
        items: userItems,
        latestItem: latest,
        isActive: hasActive,
      });
    });

    return result;
  }, [items]);

  // Actions
  const requestDelete = (userId: string) => setUserToDelete(userId);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/payments/admin/fm-metrix/access/${userToDelete}`);
      notifySuccess("Accès et historique révoqués.");
      onRefresh();
      setUserToDelete(null);
    } catch (e) {
      console.error(e);
      notifyError("Erreur lors de la révocation.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full mb-2 dark:border-slate-700 dark:border-t-indigo-400"></div>
        <p className="text-slate-400 text-sm">Chargement des utilisateurs...</p>
      </div>
    );

  if (groupedUsers.length === 0)
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
        <p className="text-slate-500 dark:text-slate-400">
          Aucun utilisateur dans cette catégorie.
        </p>
      </div>
    );

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {/* Wrapper pour le scroll horizontal */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium w-1/3">Utilisateur</th>
                <th className="px-6 py-4 font-medium">État Actuel</th>
                <th className="px-6 py-4 font-medium">Fin d&apos;accès</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {groupedUsers.map((user) => {
                const isUserActive = user.isActive;

                return (
                  <tr
                    key={user.userId + user.email}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition group"
                  >
                    {/* UTILISATEUR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold uppercase shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate max-w-[180px]">
                              {user.email}
                            </span>
                            {user.items.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 whitespace-nowrap">
                                {user.items.length} abonnements
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* STATUT GLOBAL */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isUserActive ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Actif
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactif
                        </div>
                      )}
                    </td>

                    {/* DATE DE FIN (Latest) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-400 dark:text-slate-500 mb-0.5">
                          Expire le :
                        </span>
                        <span
                          className={`font-semibold text-sm ${
                            isUserActive
                              ? "text-slate-900 dark:text-white"
                              : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {user.latestItem.periodEnd
                            ? new Date(
                                user.latestItem.periodEnd,
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => setHistoryUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                          <History className="w-3.5 h-3.5" />
                          Historique
                        </button>

                        <button
                          onClick={() => requestDelete(user.userId)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition"
                          title="Révoquer l'accès"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALES --- */}

      {historyUser && (
        <UserHistoryModal
          userEmail={historyUser.email}
          userName={historyUser.name}
          history={historyUser.items}
          onClose={() => setHistoryUser(null)}
        />
      )}

      {userToDelete && (
        <DeleteConfirmModal
          loading={isDeleting}
          onClose={() => setUserToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
