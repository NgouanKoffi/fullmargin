import { useMemo, useState, useEffect } from "react";
import type { Conversation } from "../useConversations";

export type TabKey = "private" | "group";

export function useMessagesSheet(
  open: boolean,
  items: Conversation[],
  onRetry?: () => void
) {
  const [activeTab, setActiveTab] = useState<TabKey>("private");
  const [q, setQ] = useState("");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([]);

  // Sort by most recent
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.timeISO ? new Date(a.timeISO).getTime() : 0;
      const dateB = b.timeISO ? new Date(b.timeISO).getTime() : 0;
      return dateB - dateA;
    });
  }, [items]);

  // Filter by query
  const allFiltered = useMemo(
    () =>
      sortedItems.filter((x) =>
        q.trim()
          ? (x.name || "").toLowerCase().includes(q.trim().toLowerCase())
          : true
      ),
    [sortedItems, q]
  );

  const privates = useMemo(
    () => allFiltered.filter((x) => x.variant === "private"),
    [allFiltered]
  );

  const groups = useMemo(
    () => allFiltered.filter((x) => x.variant === "group"),
    [allFiltered]
  );

  // Unread counts based on global sorting (unaffected by search)
  const privateUnreadTotal = useMemo(
    () =>
      sortedItems
        .filter((x) => x.variant === "private")
        .reduce((sum, c) => {
          const isLocallyRead = locallyReadIds.includes(c.id);
          return sum + (isLocallyRead ? 0 : c.unread ?? 0);
        }, 0),
    [sortedItems, locallyReadIds]
  );

  const groupUnreadTotal = useMemo(
    () =>
      sortedItems
        .filter((x) => x.variant === "group")
        .reduce((sum, c) => {
          const isLocallyRead = locallyReadIds.includes(c.id);
          return sum + (isLocallyRead ? 0 : c.unread ?? 0);
        }, 0),
    [sortedItems, locallyReadIds]
  );

  // Ensure activeConv matches activeTab
  useEffect(() => {
    if (!activeConv) return;
    if (activeTab === "private" && activeConv.variant !== "private") {
      setActiveConv(null);
    }
    if (activeTab === "group" && activeConv.variant !== "group") {
      setActiveConv(null);
    }
  }, [activeTab, activeConv]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setActiveConv(null);
      setLocallyReadIds([]);
      setQ("");
      setActiveTab("private");
    }
  }, [open]);

  const handleSelectConv = (c: Conversation) => {
    setActiveConv(c);
    setLocallyReadIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
  };

  const handleBackFromThread = () => {
    setActiveConv(null);
    if (onRetry) onRetry();
  };

  return {
    activeTab,
    setActiveTab,
    q,
    setQ,
    activeConv,
    setActiveConv,
    locallyReadIds,
    setLocallyReadIds,
    privates,
    groups,
    privateUnreadTotal,
    groupUnreadTotal,
    handleSelectConv,
    handleBackFromThread,
  };
}
