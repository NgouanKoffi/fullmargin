import { useEffect } from "react";
import type { Conversation } from "../useConversations";
import type { TabKey } from "./useMessagesSheet";

export function useMessagesInterceptor(
  setActiveTab: (val: TabKey) => void,
  setActiveConv: (conv: Conversation | null) => void,
  setLocallyReadIds: (updateFn: (prev: string[]) => string[]) => void
) {
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        groupId?: string;
        userId?: string;
        name?: string;
        avatar?: string;
      }>;

      if (!custom.detail) return;
      const { groupId, userId, name, avatar } = custom.detail;

      window.dispatchEvent(new Event("fm:toggle-messages"));

      if (groupId) {
        setActiveTab("group");
        setActiveConv({
          id: groupId,
          name: name || "Groupe",
          avatar,
          variant: "group",
        });
        setLocallyReadIds((prev) =>
          prev.includes(groupId) ? prev : [...prev, groupId]
        );
      } else if (userId) {
        setActiveTab("private");
        setActiveConv({
          id: userId,
          name: name || "Utilisateur",
          avatar,
          variant: "private",
        });
        setLocallyReadIds((prev) =>
          prev.includes(userId) ? prev : [...prev, userId]
        );
      }
    };

    window.addEventListener("fm:open-messages", handler as EventListener);
    return () => {
      window.removeEventListener("fm:open-messages", handler as EventListener);
    };
  }, [setActiveTab, setActiveConv, setLocallyReadIds]);
}
