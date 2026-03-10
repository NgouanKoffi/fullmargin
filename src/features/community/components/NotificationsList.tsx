// src/pages/communaute/private/community-details/components/NotificationsList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  MessageSquare,
  UserPlus,
  ThumbsUp,
  FileText,
  Check,
  LogOut,
  CheckCheck, // ✅ Nouvel import pour l'icône
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationsAsSeen,
  type CommunityNotification,
} from "@features/community/api/notifications.service";

type NotificationItem = CommunityNotification & {
  _id?: string;
  message?: string;
};

type NotificationTarget = {
  communityId?: string;
  postId?: string;
  requestId?: string;
  kind?: string;
};

type Props = {
  communityId?: string;
  onGoTo?: (target: NotificationTarget) => void;
};

// 🔒 liste blanche des KINDS "communauté" + groupes + formations
const COMMUNITY_KINDS = new Set<string>([
  "community_member_joined",
  "community_member_left",
  "community_post_created",
  "community_post_created_admin",
  "community_post_commented",
  "community_comment_replied",
  "community_post_liked",
  "community_request_received",
  "community_request_approved",
  "community_request_rejected",
  "community_post_deleted_by_admin",
  "community_comment_deleted",
  // 👇 nouveaux types
  "course_manual_enrollment",
  "course_manual_unenrollment",
  "group_manual_add_member",
  "group_manual_remove_member",
]);

// on génère le texte en fonction du kind + du payload
function buildMessageFromNotif(n: CommunityNotification): string {
  const payload = (n.payload || {}) as Record<string, unknown>;
  const fromUserName =
    (payload.fromUserName as string | undefined) ||
    (payload.joinedUserName as string | undefined) ||
    (payload.leftUserName as string | undefined) ||
    "";
  const communityName = (payload.communityName as string | undefined) || "";
  const courseTitle = (payload.courseTitle as string | undefined) || "";
  const groupName = (payload.groupName as string | undefined) || "";

  switch (n.kind) {
    case "community_member_joined":
      return fromUserName
        ? `${fromUserName} s’est abonné à ta communauté`
        : "Un nouveau membre s’est abonné à ta communauté";

    case "community_member_left":
      return fromUserName
        ? `${fromUserName} a quitté ta communauté`
        : "Un membre a quitté ta communauté";

    case "community_post_created":
      return fromUserName
        ? `${fromUserName} a publié dans ta communauté`
        : "Un membre a publié dans ta communauté";

    case "community_post_created_admin":
      return communityName
        ? `Nouvelle publication dans ${communityName}`
        : "Nouvelle publication dans la communauté";

    case "community_post_commented":
      return fromUserName
        ? `${fromUserName} a commenté ton post`
        : "Un membre a commenté ton post";

    case "community_comment_replied":
      return fromUserName
        ? `${fromUserName} a répondu à ton commentaire`
        : "Un membre a répondu à ton commentaire";

    case "community_post_liked":
      return fromUserName
        ? `${fromUserName} a aimé ton post`
        : "Un membre a aimé ton post";

    case "community_request_received":
      return fromUserName
        ? `${fromUserName} a demandé à rejoindre ta communauté`
        : "Nouvelle demande d’adhésion à ta communauté";

    case "community_request_approved":
      return `Ta demande pour ${
        communityName || "la communauté"
      } a été acceptée`;

    case "community_request_rejected":
      return `Ta demande pour ${
        communityName || "la communauté"
      } a été refusée`;

    case "community_post_deleted_by_admin":
      return communityName
        ? `Ton post a été supprimé dans ${communityName}`
        : "Ton post a été supprimé par un administrateur";

    case "community_comment_deleted":
      return "Ton commentaire a été supprimé";

    // ✅ formations
    case "course_manual_enrollment":
      return courseTitle
        ? `Tu as reçu l’accès à la formation « ${courseTitle} »`
        : "Tu as reçu l’accès à une formation";

    case "course_manual_unenrollment":
      return courseTitle
        ? `Ton accès à la formation « ${courseTitle} » a été retiré`
        : "Ton accès à une formation a été retiré";

    // ✅ groupes
    case "group_manual_add_member":
      return groupName
        ? `Tu as été ajouté au groupe « ${groupName} »`
        : "Tu as été ajouté à un groupe";

    case "group_manual_remove_member":
      return groupName
        ? `Tu as été retiré du groupe « ${groupName} »`
        : "Tu as été retiré d’un groupe";

    default:
      return "Notification";
  }
}

export default function NotificationsList({ communityId, onGoTo }: Props) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // helper local : on garde UNIQUEMENT les notifs communauté / groupe / formation
  const isCommunityNotifForScope = (n: CommunityNotification): boolean => {
    if (!COMMUNITY_KINDS.has(n.kind)) return false; // ❌ on vire messages & autres

    const payload = (n.payload || {}) as Record<string, unknown>;
    const payloadCommunityId = payload.communityId as string | undefined;

    // si on a une communauté ciblée → on ne garde que celles de cette communauté
    if (communityId) {
      return (
        n.communityId === communityId ||
        (!!payloadCommunityId && payloadCommunityId === communityId)
      );
    }

    // sinon → on garde toutes les notifs liées à une communauté
    return Boolean(n.communityId || payloadCommunityId);
  };

  // chargement initial
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const json = await fetchNotifications(1, 50);

        // 👉 filtrer les notifs (communauté / groupe / formation)
        const filtered = json.items.filter(isCommunityNotifForScope);

        const mapped: NotificationItem[] = filtered.map((n) => ({
          ...n,
          _id: n.id ?? String(Math.random()),
          message: buildMessageFromNotif(n),
        }));

        setNotifications(mapped);
      } catch (e) {
        console.error("[NotificationsList] load error:", e);
        setError("Impossible de charger les notifications");
      } finally {
        setLoading(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  // helper pour la navigation "classique" (communauté, demandes, etc)
  const go = (target: NotificationTarget) => {
    if (typeof onGoTo === "function") {
      onGoTo(target);
    }
  };

  // ✅ LOGIQUE DU BOUTON "TOUT MARQUER COMME LU"
  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => !n.seen);
    if (unreadItems.length === 0) return;

    const ids = unreadItems.map((n) => n.id);

    // 1. Mise à jour Optimiste UI
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));

    // 2. Notifier le compteur global (header)
    window.dispatchEvent(new Event("fm:community-notifs:seen-all"));

    // 3. Appel API
    try {
      await markNotificationsAsSeen(ids);
    } catch (e) {
      console.error("Failed to mark all as seen", e);
    }
  };

  // clic sur une notif
  const handleClick = async (notif: NotificationItem) => {
    if (!notif) return;

    // 1. marquer localement comme vue
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, seen: true } : n)),
    );

    // 2. notifier le header (badge communautés)
    window.dispatchEvent(
      new CustomEvent("fm:community-notifs:seen-one", {
        detail: { id: notif.id },
      }),
    );

    // 3. API mark seen
    void markNotificationsAsSeen([notif.id]);

    // 4. navigation / ouverture de modal / messages
    const payload = (notif.payload || {}) as Record<string, unknown>;
    const actorName =
      (payload.fromUserName as string | undefined) ||
      (payload.joinedUserName as string | undefined) ||
      (payload.leftUserName as string | undefined) ||
      undefined;

    switch (notif.kind) {
      // 👉 tous ceux qui doivent ouvrir le post
      case "community_post_commented":
      case "community_post_liked":
      case "community_comment_replied":
      case "community_post_created_admin":
      case "community_post_deleted_by_admin":
      case "community_post_created": {
        const postId = payload.postId as string | undefined;
        const cid = (payload.communityId as string | undefined) || undefined;
        if (postId) {
          window.dispatchEvent(
            new CustomEvent("fm:community:open-post", {
              detail: {
                postId,
                communityId: cid,
                message: notif.message,
                kind: notif.kind,
                actorName,
              },
            }),
          );
        } else if (cid) {
          go({ kind: notif.kind, communityId: cid });
        }
        break;
      }

      // abonnements
      case "community_member_joined":
      case "community_member_left": {
        const cid = payload.communityId as string | undefined;
        if (cid) {
          go({ kind: notif.kind, communityId: cid });
        }
        break;
      }

      // demandes
      case "community_request_received":
      case "community_request_approved":
      case "community_request_rejected": {
        const rid = payload.requestId as string | undefined;
        const cid = (payload.communityId as string | undefined) || undefined;
        if (rid) {
          go({ kind: notif.kind, requestId: rid, communityId: cid });
        }
        break;
      }

      // ✅ formations : navigation REACT ROUTER directe, sans refresh
      case "course_manual_enrollment":
      case "course_manual_unenrollment": {
        const courseId = payload.courseId as string | undefined;
        if (courseId) {
          navigate(`/communaute/formation/${courseId}`);
        }
        break;
      }

      // ✅ groupes : ouverture directe de la discussion de groupe
      case "group_manual_add_member":
      case "group_manual_remove_member": {
        const groupId = payload.groupId as string | undefined;
        const groupName = (payload.groupName as string | undefined) || "Groupe";

        if (groupId) {
          window.dispatchEvent(
            new CustomEvent("fm:open-messages", {
              detail: {
                groupId,
                name: groupName,
                avatar: undefined,
              },
            }),
          );
        }
        break;
      }

      default:
        break;
    }
  };

  // icônes selon le kind + état lu/non lu
  const getIcon = (kind: string, seen: boolean) => {
    const base = seen ? "text-slate-400" : "text-violet-500";

    switch (kind) {
      case "community_post_commented":
      case "community_comment_replied":
        return <MessageSquare className={`w-5 h-5 ${base}`} />;

      case "community_post_liked":
        return <ThumbsUp className={`w-5 h-5 ${base}`} />;

      case "community_member_joined":
        return (
          <UserPlus
            className={`w-5 h-5 ${seen ? "text-slate-400" : "text-green-500"}`}
          />
        );

      case "community_member_left":
        return (
          <LogOut
            className={`w-5 h-5 ${seen ? "text-slate-400" : "text-rose-500"}`}
          />
        );

      case "community_request_received":
        return (
          <FileText
            className={`w-5 h-5 ${seen ? "text-slate-400" : "text-amber-500"}`}
          />
        );

      case "community_request_approved":
      case "community_request_rejected":
        return <Check className={`w-5 h-5 ${base}`} />;

      case "community_post_deleted_by_admin":
      case "community_post_created_admin":
      case "community_post_created":
        return <Bell className={`w-5 h-5 ${base}`} />;

      // ✅ icône formations
      case "course_manual_enrollment":
      case "course_manual_unenrollment":
        return (
          <FileText
            className={`w-5 h-5 ${seen ? "text-slate-400" : "text-indigo-500"}`}
          />
        );

      // ✅ icône groupes
      case "group_manual_add_member":
      case "group_manual_remove_member":
        return (
          <MessageSquare
            className={`w-5 h-5 ${
              seen ? "text-slate-400" : "text-emerald-500"
            }`}
          />
        );

      default:
        return <Bell className={`w-5 h-5 ${base}`} />;
    }
  };

  const visibleList =
    filter === "unread" ? notifications.filter((n) => !n.seen) : notifications;

  // Calcul pour savoir si on affiche le bouton "Tout marquer comme lu"
  const hasUnread = notifications.some((n) => !n.seen);

  return (
    <div className="w-full">
      <div className="p-4 sm:p-5">
        {/* header + filtres */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>

          <div className="flex items-center gap-2">
            {/* ✅ BOUTON AJOUTÉ ICI : Tout marquer comme lu */}
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition mr-2"
                title="Marquer toutes les notifications affichées comme lues"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden md:inline">Tout marquer comme lu</span>
              </button>
            )}

            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900/40 p-1 gap-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filter === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                    : "text-slate-500 dark:text-slate-300"
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filter === "unread"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                    : "text-slate-500 dark:text-slate-300"
                }`}
              >
                Non lues ({notifications.filter((n) => !n.seen).length})
              </button>
            </div>
          </div>
        </div>

        {/* ✅ BOUTON VERSION MOBILE (Visible uniquement sur petit écran) */}
        {hasUnread && (
          <div className="sm:hidden mb-4 flex justify-end">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          </div>
        )}

        {/* états */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && <div className="text-center text-red-500 py-6">{error}</div>}

        {!loading && !error && visibleList.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filter === "unread"
              ? "Tu as tout lu 🎉"
              : "Aucune notification pour le moment."}
          </div>
        )}

        {/* liste */}
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleList.map((notif) => {
            const isUnread = !notif.seen;
            return (
              <li
                key={notif._id}
                onClick={() => void handleClick(notif)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition h-full border
                ${
                  isUnread
                    ? "bg-violet-50/80 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/40 shadow-sm"
                    : "bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800"
                }
                hover:translate-y-[1px]
              `}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notif.kind, !isUnread)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm break-words ${
                      isUnread
                        ? "text-slate-900 dark:text-white font-semibold"
                        : "text-slate-700 dark:text-slate-100"
                    }`}
                  >
                    {notif.message || "Notification"}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(notif.createdAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                {isUnread ? (
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500 shadow-sm" />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
