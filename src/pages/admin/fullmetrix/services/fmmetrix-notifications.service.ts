// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\services\fmmetrix-notifications.service.ts
import { api } from "../../../../lib/api";

export type FmMetrixNotification = {
  id: string;
  kind: string;
  seen: boolean;
  createdAt: string;
  payload: {
    title?: string;
    message?: string;
    feature?: string; // "fm-metrix"
    [key: string]: any;
  };
};

export async function fetchFmMetrixNotifications(limit = 20) {
  try {
    // On récupère tout et on filtrera côté client ou via query params si ton backend le supporte
    const res = await api.get<{ ok: boolean; data: { items: any[] } }>(
      `/notifications?limit=${limit}`,
    );

    if (!res.ok) return [];

    // Filtrer uniquement les notifs FM Metrix
    return res.data.items
      .filter(
        (n: any) =>
          n.kind.startsWith("fmmetrix.") || n.payload?.feature === "fm-metrix",
      )
      .map((n: any) => ({
        id: n.id,
        kind: n.kind,
        seen: n.seen,
        createdAt: n.createdAt,
        payload: n.payload || {},
      }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function markAsSeen(ids: string[]) {
  try {
    await api.post("/notifications/mark-seen", { ids });
    return true;
  } catch {
    return false;
  }
}
