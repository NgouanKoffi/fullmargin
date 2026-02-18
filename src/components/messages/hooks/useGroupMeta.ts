// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\messages\hooks\useGroupMeta.ts
import { useEffect, useState } from "react";
import type { Conversation } from "../useConversations";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

export type GroupMeta = {
  membersCount?: number;
  isAdmin: boolean;
  coverUrl?: string | null;
  /** true = seuls les admins peuvent poster */
  onlyAdminsCanPost?: boolean;
};

export function useGroupMeta(activeConv: Conversation | null) {
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null);

  useEffect(() => {
    if (!activeConv || activeConv.variant !== "group") {
      setGroupMeta(null);
      return;
    }

    const session = (loadSession() as { token?: string } | null) || null;
    const token = session?.token;
    if (!token) {
      setGroupMeta(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const base = API_BASE.replace(/\/+$/, "");
        const url = `${base}/communaute/discussions/groups/${encodeURIComponent(
          activeConv.id
        )}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          setGroupMeta(null);
          return;
        }

        const json: any = await res.json().catch(() => null);
        if (!json || json.ok === false || !json.data?.group) {
          setGroupMeta(null);
          return;
        }

        const g = json.data.group;
        setGroupMeta({
          membersCount:
            typeof g.membersCount === "number" ? g.membersCount : undefined,
          isAdmin: !!g.isAdmin,
          coverUrl: g.coverUrl || null,
          onlyAdminsCanPost: !!g.onlyAdminsCanPost,
        });
      } catch {
        if (controller.signal.aborted) return;
        setGroupMeta(null);
      }
    })();

    return () => controller.abort();
  }, [activeConv]);

  const membersCount =
    typeof groupMeta?.membersCount === "number"
      ? groupMeta.membersCount
      : undefined;

  const headerAvatarUrl =
    activeConv && activeConv.variant === "group"
      ? groupMeta?.coverUrl ||
        (activeConv as any).avatar ||
        (activeConv as any).avatarUrl ||
        (activeConv as any).coverUrl ||
        (activeConv as any).bannerUrl ||
        activeConv.avatar
      : activeConv?.avatar || undefined;

  return { groupMeta, membersCount, headerAvatarUrl };
}
