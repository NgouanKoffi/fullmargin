// c:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notifications.tsx
import { useEffect, useState } from "react";
import { Bell, Users, ShoppingBag, Wallet, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE } from "../lib/api";
import { loadSession } from "../auth/lib/storage";

type NotificationCategory = "all" | "community" | "marketplace" | "finance" | "admin";

type Notification = {
  id: string;
  kind: string;
  communityId?: string | null;
  payload?: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { status } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Charger les notifications
  useEffect(() => {
    let aborted = false;

    async function load() {
      if (status !== "authenticated") {
        if (!aborted) setLoading(false);
        return;
      }

      try {
        const token = loadSession()?.token;
        if (!token) {
          if (!aborted) setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/notifications?page=1&limit=200`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!aborted) setLoading(false);
          return;
        }

        const json = await res.json();
        const items = json?.data?.items || [];

        if (!aborted) {
          setNotifications(items);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        if (!aborted) setLoading(false);
      }
    }

    load();

    return () => {
      aborted = true;
    };
  }, [status]);

  // Marquer une notification comme lue
  const markAsRead = async (id: string) => {
    try {
      const token = loadSession()?.token;
      if (!token) return;

      // ✅ Utiliser l'endpoint correct avec array d'IDs
      await fetch(`${API_BASE}/notifications/mark-seen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id] }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
      );

      // Notifier le header pour mettre à jour le badge
      window.dispatchEvent(new Event("fm:community-notifs:seen-one"));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Gérer le clic sur une notification (navigation contextuelle)
  const handleNotificationClick = (notif: Notification) => {
    // Types de notifications non-cliquables (informatives seulement, pas de redirect ion)
    const nonClickableTypes = [
      "community_member_left",
      "community_member_joined",
      "community_live_ended",
      "community_live_cancelled",
    ];
    
    // Si la notification n'est pas cliquable, on marque comme lue et on s'arrête
    if (nonClickableTypes.includes(notif.kind)) {
      if (!notif.seen) {
        markAsRead(notif.id);
      }
      return; // ❌ Pas de navigation pour ces types
    }

    // Marquer comme lue si non lue
    if (!notif.seen) {
      markAsRead(notif.id);
    }

    // Navigation contextuelle basée sur le type
    const kind = notif.kind;
    const payload = notif.payload || {};

    // Marketplace
    if (kind === "marketplace_product_submitted" || 
        kind === "marketplace_product_approved" || 
        kind === "marketplace_product_rejected") {
      if (payload.productId) {
        navigate(`/marketplace/products/${payload.productId}`);
      } else {
        navigate("/marketplace");
      }
      return;
    }

    if (kind === "marketplace_sale_made") {
      navigate("/finance#ventes");
      return;
    }

    // Finance
    if (kind.startsWith("finance_withdrawal_")) {
      navigate("/finance#retraits");
      return;
    }

    // Community - cas spécial pour demandes d'accès (ADMIN)
    if (kind === "community_request_received") {
      // Admin → rediriger vers Mes abonnements pour gérer la demande
      const communitySlug = payload.communitySlug || notif.communityId;
      if (communitySlug) {
        navigate(`/communaute/${communitySlug}?tab=demandes&sub=incoming&mstatus=pending&istatus=pending`);
      } else {
        navigate("/communaute");
      }
      return;
    }

    // Community - demandes approuvées/refusées (USER)
    if (kind === "community_request_approved" || kind === "community_request_rejected") {
      // User → rediriger vers la page de la communauté
      const communitySlug = payload.communitySlug || notif.communityId;
      if (communitySlug) {
        navigate(`/communaute/${communitySlug}`);
      } else {
        navigate("/communaute");
      }
      return;
    }

    // Autres notifications communauté
    if (kind.startsWith("community_")) {
      if (notif.communityId) {
        let url = `/communaute/${notif.communityId}`;
        
        // ✅ Deep link vers un post spécifique
        // On regarde si on a un postId dans le payload
        // (post_created, post_commented, comment_replied, post_liked...)
        const postId = payload.postId || payload.relatedPostId; 
        if (postId) {
          url += `?postId=${postId}`;
        }
        
        navigate(url);
      } else {
        navigate("/communautes");
      }
      return;
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = loadSession()?.token;
      if (!token) return;

      const unreadIds = notifications
        .filter((n) => !n.seen)
        .map((n) => n.id);

      // ✅ Un seul appel POST avec tous les IDs
      await fetch(`${API_BASE}/notifications/mark-seen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: unreadIds }),
      });

      // Mettre à jour l'état local
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));

      // Notifier le header
      window.dispatchEvent(new Event("fm:community-notifs:seen-all"));
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (kind: string) => {
    if (kind.startsWith("community_")) return Users;
    if (kind.startsWith("marketplace_")) return ShoppingBag;
    if (kind.startsWith("finance_") || kind.startsWith("fmmetrix_")) return Wallet;
    if (kind.startsWith("discussion_")) return MessageSquare;
    return Bell;
  };

  // Obtenir la catégorie d'une notification
  const getNotificationCategory = (kind: string): NotificationCategory => {
    if (kind.startsWith("community_")) return "community";
    if (kind.startsWith("marketplace_")) return "marketplace";
    if (kind.startsWith("finance_")) return "finance";
    if (kind.startsWith("admin_")) return "admin";
    if (kind.startsWith("fmmetrix_")) return "finance"; // FM Metrix = finance
    return "all";
  };

  // Filtrer les notifications
  // ❌ IMPORTANT: Retirer TOUS les messages (discussion_*) - ils sont gérés dans l'icône message
  let filteredNotifications = notifications.filter(
    (n) => !n.kind.startsWith("discussion_")
  );

  // Filtre par statut (lu/non lu)
  if (filter === "unread") {
    filteredNotifications = filteredNotifications.filter((n) => !n.seen);
  }

  // Filtre par catégorie
  if (categoryFilter !== "all") {
    filteredNotifications = filteredNotifications.filter(
      (n) => getNotificationCategory(n.kind) === categoryFilter
    );
  }

  // Formater le type de notification avec contexte et noms d'utilisateurs
  const getNotificationTitle = (notif: Notification): string => {
    const { kind, payload = {} } = notif;
    const communityName = payload.communityName || "votre communauté";
    const productName = payload.productName || "Votre produit";
    
    // Community - avec nom de communauté ET utilisateur
    if (kind === "community_member_joined") {
      const user = payload.joinedUserName || "Un nouveau membre";
      return `${user} a rejoint votre communauté ${communityName}`;
    }
    
    if (kind === "community_member_left") {
      const user = payload.leftUserName || "Un membre";
      return `${user} a quitté votre communauté ${communityName}`;
    }
    
    if (kind === "community_post_created") {
      const user = payload.fromUserName || "Un membre";
      return `${user} a publié dans la communauté ${communityName}`;
    }
    
    if (kind === "community_post_created_admin") {
      const user = payload.fromUserName || "L'admin";
      return `${user} a publié dans la communauté ${communityName}`;
    }
    
    if (kind === "community_post_commented") {
      const user = payload.fromUserName || "Quelqu'un";
      return `${user} a commenté dans ${communityName}`;
    }
    
    if (kind === "community_comment_replied") {
      const user = payload.fromUserName || "Quelqu'un";
      return `${user} vous a répondu dans ${communityName}`;
    }
    
    if (kind === "community_post_liked") {
      const user = payload.fromUserName || "Quelqu'un";
      return `${user} a aimé votre publication dans ${communityName}`;
    }
    
    if (kind === "community_request_received") {
      const user = payload.requesterName || "Un utilisateur";
      return `${user} demande à rejoindre ${communityName}`;
    }
    
    if (kind === "community_request_approved") {
      return `Votre demande pour ${communityName} a été approuvée`;
    }
    
    if (kind === "community_request_rejected") {
      return `Votre demande pour ${communityName} a été refusée`;
    }
    
    if (kind === "community_post_deleted_by_admin") {
      return `Votre publication dans ${communityName} a été supprimée`;
    }
    
    if (kind === "community_comment_deleted") {
      return `Votre commentaire dans ${communityName} a été supprimé`;
    }
    
    if (kind === "community_group_created") {
      const user = payload.fromUserName || "L'admin";
      return `${user} a créé un groupe dans ${communityName}`;
    }
    
    if (kind === "community_group_member_added") {
      return `Vous avez été ajouté à un groupe de ${communityName}`;
    }
    
    if (kind === "community_group_member_removed") {
      return `Vous avez été retiré d'un groupe de ${communityName}`;
    }
    
    if (kind === "community_course_created") {
      const user = payload.fromUserName || "L'admin";
      return `${user} a créé une formation dans ${communityName}`;
    }
    
    if (kind === "community_course_enrolled") {
      return `Vous avez été inscrit à une formation de ${communityName}`;
    }
    
    if (kind === "community_course_unenrolled") {
      return `Vous avez été désinscrit d'une formation de ${communityName}`;
    }
    
    if (kind === "community_live_scheduled") {
      const user = payload.fromUserName || "L'admin";
      return `${user} a programmé un live dans ${communityName}`;
    }
    
    if (kind === "community_live_started") {
      const user = payload.fromUserName || "L'admin";
      return `🔴 ${user} est en live dans ${communityName}`;
    }
    
    if (kind === "community_live_ended") {
      return `Le live dans ${communityName} est terminé`;
    }
    
    if (kind === "community_live_cancelled") {
      return `Le live dans ${communityName} a été annulé`;
    }

    // Marketplace - avec nom de produit
    if (kind === "marketplace_product_submitted") return `${productName} soumis pour validation`;
    if (kind === "marketplace_product_approved") return `✅ ${productName} approuvé`;
    if (kind === "marketplace_product_rejected") return `❌ ${productName} refusé`;
    if (kind === "marketplace_sale_made") return `💰 Vente réalisée`;
    if (kind === "marketplace_purchase_made") return `Achat effectué`;

    // Finance
    if (kind === "finance_withdrawal_requested") return `Retrait demandé`;
    if (kind === "finance_withdrawal_approved") return `✅ Retrait approuvé`;
    if (kind === "finance_withdrawal_rejected") return `❌ Retrait refusé`;

    // FM Metrix
    if (kind === "fmmetrix_subscription_granted") return `✨ Abonnement FM Metrix accordé`;
    if (kind === "fmmetrix_subscription_expired") return `⏰ Abonnement FM Metrix expiré`;
    if (kind === "fmmetrix_subscription_renewed") return `🔄 Abonnement FM Metrix renouvelé`;
    if (kind === "fmmetrix_subscription_cancelled") return `❌ Abonnement FM Metrix résilié`;

    // Admin
    if (kind === "admin_withdrawal_pending") {
      const user = payload.userName || "Un utilisateur";
      return `Retrait en attente - ${user}`;
    }
    if (kind === "admin_product_pending") {
      const user = payload.sellerName || "Un vendeur";
      return `Nouveau produit de ${user} à valider`;
    }
    if (kind === "admin_fmmetrix_crypto_pending") return `Paiement crypto FM Metrix à valider`;
    if (kind === "admin_marketplace_crypto_pending") return `Paiement crypto marketplace à valider`;

    return "Nouvelle notification";
  };

  // Formater la date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Mark all as read button */}
            {notifications.some((n) => !n.seen) && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingAll ? "..." : "Tout marquer comme lu"}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            {/* Status Filters */}
            <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
              <button
                onClick={() => setFilter("all")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  filter === "all"
                    ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  filter === "unread"
                    ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Non lues
                {notifications.filter((n) => !n.seen).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                    {notifications.filter((n) => !n.seen).length}
                  </span>
                )}
              </button>
            </div>

            {/* Category Filters - Scrollable horizontal pour mobile */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 min-w-max">
                {[
                  { key: "all", label: "Toutes", icon: Bell },
                  { key: "community", label: "Communauté", icon: Users },
                  { key: "marketplace", label: "Marketplace", icon: ShoppingBag },
                  { key: "finance", label: "Retrait", icon: Wallet },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key as NotificationCategory)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      categoryFilter === cat.key
                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <Bell className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === "unread"
                ? "Vous êtes à jour ! Toutes vos notifications ont été lues."
                : "Vous n'avez pas encore de notifications."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredNotifications.map((notif) => {
              // Vérifier si cette notification est cliquable
              const nonClickableTypes = [
                "community_member_left",
                "community_member_joined",
                "community_live_ended",
                "community_live_cancelled",
              ];
              const isClickable = !nonClickableTypes.includes(notif.kind);

              return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isClickable ? "cursor-pointer hover:scale-[1.01]" : "cursor-default"
                } ${
                  notif.seen
                    ? `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${isClickable ? "hover:border-slate-300 dark:hover:border-slate-700" : ""}`
                    : `bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/10 border-violet-200 dark:border-violet-800/50 ${isClickable ? "hover:border-violet-300 dark:hover:border-violet-700" : ""} shadow-sm shadow-violet-100 dark:shadow-violet-900/20`
                } ${isClickable ? "hover:shadow-lg" : ""}`}
              >
                {/* Unread indicator */}
                {!notif.seen && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-600"></div>
                )}

                <div className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        notif.seen
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                          : "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30"
                      }`}
                    >
                      {(() => {
                        const IconComponent = getNotificationIcon(notif.kind);
                        return <IconComponent className="w-6 h-6" />;
                      })()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">
                          {getNotificationTitle(notif)}
                        </h3>
                        {!notif.seen && (
                          <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-violet-600 mt-2"></span>
                        )}
                      </div>

                      {!!notif.payload?.message && (
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                          {String(notif.payload.message)}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(notif.createdAt)}
                        </span>
                        {notif.seen && (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Lu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}