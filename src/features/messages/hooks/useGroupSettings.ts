import { useState, useEffect } from "react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import type { Conversation } from "../useConversations";

export function useGroupSettings(
  activeConv: Conversation | null,
  isGroup: boolean,
  isGroupAdmin: boolean,
  onlyAdminsCanPost?: boolean,
  openContext?: boolean
) {
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupChatLocked, setGroupChatLocked] = useState(false);

  // Sync to API state on mount / changes
  useEffect(() => {
    if (!isGroup) {
      setGroupChatLocked(false);
      return;
    }
    setGroupChatLocked(!!onlyAdminsCanPost);
  }, [isGroup, onlyAdminsCanPost]);

  // Reset settings window if sheet is closed
  useEffect(() => {
    if (openContext !== undefined && !openContext) {
      setGroupSettingsOpen(false);
      setGroupChatLocked(false);
    }
  }, [openContext]);

  const handleOpenGroupSettings = () => {
    if (!activeConv || activeConv.variant !== "group") return;
    if (!isGroupAdmin) return;
    setGroupSettingsOpen(true);
  };

  const handleToggleGroupLock = async () => {
    if (!activeConv || activeConv.variant !== "group") return;
    if (!isGroupAdmin) return;

    const session = (loadSession() as { token?: string } | null) || null;
    const token = session?.token;
    if (!token) return;

    const next = !groupChatLocked;
    setGroupChatLocked(next);

    try {
      const base = API_BASE.replace(/\/+$/, "");
      const res = await fetch(
        `${base}/communaute/discussions/groups/${encodeURIComponent(
          activeConv.id
        )}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ onlyAdminsCanPost: next }),
        }
      );
      if (!res.ok) throw new Error(`Erreur API (${res.status})`);
    } catch (e) {
      console.error("[MessagesSheet] toggle group lock failed:", e);
      setGroupChatLocked((prev) => !prev);
    }
  };

  const chatLockedForMembers = isGroup && groupChatLocked && !isGroupAdmin;

  return {
    groupSettingsOpen,
    setGroupSettingsOpen,
    groupChatLocked,
    chatLockedForMembers,
    handleOpenGroupSettings,
    handleToggleGroupLock,
  };
}
