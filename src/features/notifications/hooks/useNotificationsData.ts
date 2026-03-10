import { useEffect, useState } from "react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import type { Notification, NotificationCategory } from "../constants";
import { getNotificationCategory } from "./notificationFormats";

export function useNotificationsData(status: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>("all");
  const [markingAll, setMarkingAll] = useState(false);

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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!aborted) setLoading(false);
          return;
        }
        const json = await res.json();
        if (!aborted) {
          setNotifications(json?.data?.items || []);
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

  const markAsRead = async (id: string) => {
    try {
      const token = loadSession()?.token;
      if (!token) return;
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
      window.dispatchEvent(new Event("fm:community-notifs:seen-one"));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = loadSession()?.token;
      if (!token) return;
      const unreadIds = notifications.filter((n) => !n.seen).map((n) => n.id);
      await fetch(`${API_BASE}/notifications/mark-seen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: unreadIds }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      window.dispatchEvent(new Event("fm:community-notifs:seen-all"));
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  let filtered = notifications.filter(
    (n) =>
      !n.kind.startsWith("discussion_") &&
      n.kind !== "community_live_ended" &&
      n.kind !== "community_live_cancelled"
  );

  if (filter === "unread") filtered = filtered.filter((n) => !n.seen);
  if (categoryFilter !== "all")
    filtered = filtered.filter(
      (n) => getNotificationCategory(n.kind) === categoryFilter
    );

  const unreadCount = notifications.filter(
    (n) => !n.seen && !n.kind.startsWith("discussion_")
  ).length;

  const getUnreadCountForCategory = (cat: NotificationCategory) => {
    return notifications.filter(
      (n) => getNotificationCategory(n.kind) === cat && !n.seen
    ).length;
  };

  const counts: Record<NotificationCategory, number> = {
    all: unreadCount,
    community: getUnreadCountForCategory("community"),
    marketplace: getUnreadCountForCategory("marketplace"),
    courses: getUnreadCountForCategory("courses"),
    fmmetrix: getUnreadCountForCategory("fmmetrix"),
    finance: getUnreadCountForCategory("finance"),
    admin: getUnreadCountForCategory("admin"),
    roles: getUnreadCountForCategory("roles"),
  };

  return {
    notifications,
    filtered,
    loading,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    unreadCount,
    counts,
    markingAll,
    markAsRead,
    markAllAsRead,
  };
}
