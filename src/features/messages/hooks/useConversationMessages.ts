import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import type { ChatMessage, MessagesApiResponse } from "../conversation/messages.types";
import { buildTimeline } from "../conversation/timeline";
import type { Conversation } from "../useConversations";

interface SessionLite {
  token?: string;
}

export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  const text = await res.text().catch(() => "");
  throw new Error(`Erreur serveur (${res.status}) : ${text.slice(0, 100)}`);
}

export function useConversationMessages(conversation: Conversation, mode: "private" | "group") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [userAtBottom, setUserAtBottom] = useState(true);
  const prevLen = useRef(0);

  const endpoint =
    mode === "private"
      ? `${API_BASE}/communaute/discussions/private/${conversation.id}/messages`
      : `${API_BASE}/communaute/discussions/groups/${conversation.id}/messages`;

  const fetchMessages = useCallback(async () => {
    try {
      const session = loadSession() as SessionLite | null;
      const tok = session?.token || "";
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await safeJson<MessagesApiResponse>(res);
      if (json.ok) {
        const items = json.data?.items ?? [];
        setMessages((prev) => (prev.length === items.length ? prev : items));
      }
    } catch (e) {
      console.error("Erreur chargement messages:", e);
    }
  }, [endpoint]);

  useEffect(() => {
    void fetchMessages();
    const id = setInterval(() => fetchMessages(), 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (userAtBottom && messages.length > prevLen.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    }
    prevLen.current = messages.length;
  }, [messages, userAtBottom]);

  const timeline = useMemo(() => buildTimeline(messages), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const session = loadSession() as SessionLite | null;
      const tok = session?.token || "";
      const form = new FormData();
      form.append("body", input.trim());
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
        body: form,
      });
      setInput("");
      fetchMessages();
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      try {
        const session = loadSession() as SessionLite | null;
        const tok = session?.token || "";
        const res = await fetch(`${endpoint}/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) fetchMessages();
      } catch (e) {
        console.error("Erreur suppression message:", e);
      }
    },
    [endpoint, fetchMessages]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setUserAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 80);
  };

  return {
    messages,
    sending,
    input,
    setInput,
    scrollContainerRef,
    userAtBottom,
    timeline,
    handleSend,
    handleDeleteMessage,
    handleScroll,
  };
}
