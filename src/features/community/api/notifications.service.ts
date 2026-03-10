// src/pages/communaute/private/community-details/services/notifications.service.ts
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

export type CommunityNotification = {
  id: string;
  kind: string;
  communityId: string | null;
  requestId: string | null;
  payload: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
};

type NotificationListResponse = {
  items: CommunityNotification[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const EMPTY_NOTIFS: NotificationListResponse = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

// 🔒 liste blanche des KINDS "communauté" uniquement
// (même logique que dans NotificationsList)
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

  // 🔥 nouveaux types : accès formations & groupes
  "course_manual_enrollment",
  "course_manual_unenrollment",
  "group_manual_add_member",
  "group_manual_remove_member",
]);

// helper : construire l’URL même si API_BASE est vide
function buildUrl(path: string): string {
  if (typeof API_BASE === "string" && API_BASE.trim().length > 0) {
    return `${API_BASE.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
  return `/${path.replace(/^\/+/, "")}`;
}

// helper local : savoir si une notif est de type "communauté"
function isCommunityNotification(n: CommunityNotification): boolean {
  if (!COMMUNITY_KINDS.has(n.kind)) return false;
  // on ne filtre pas par communauté ici : on veut juste
  // "toutes les notifs communauté" pour le badge
  return true;
}

export async function fetchNotifications(
  page = 1,
  limit = 20,
): Promise<NotificationListResponse> {
  const token = (loadSession() as { token?: string } | null)?.token;
  const url = buildUrl("notifications") + `?page=${page}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (res.status === 401) {
      return { ...EMPTY_NOTIFS, page, limit };
    }

    const json = await res.json();

    if (!json.ok) {
      return { ...EMPTY_NOTIFS, page, limit };
    }

    return json.data as NotificationListResponse;
  } catch {
    return { ...EMPTY_NOTIFS, page, limit };
  }
}

export async function markNotificationsAsSeen(ids?: string[]) {
  const token = (loadSession() as { token?: string } | null)?.token;
  const url = buildUrl("notifications/mark-seen");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * ⚠️ IMPORTANT :
 * Avant, on appelait /notifications/unseen-count qui renvoyait
 * TOUTES les notifs (y compris messages).
 *
 * Maintenant :
 *  - on récupère une page de notifications (ex: 200)
 *  - on filtre UNIQUEMENT les notifs "communauté"
 *  - on compte seulement celles qui ne sont pas vues
 */
export async function getUnseenNotificationsCount() {
  try {
    // on prend large : 200 notifs max, suffisant pour un badge
    const list = await fetchNotifications(1, 200);

    const unseenCommunity = list.items.filter(
      (n) => !n.seen && isCommunityNotification(n),
    );

    return { count: unseenCommunity.length };
  } catch {
    return { count: 0 };
  }
}
