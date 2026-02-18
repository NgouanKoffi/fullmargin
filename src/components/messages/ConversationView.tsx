// src/components/messages/ConversationView.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";
import { loadSession } from "../../auth/lib/storage";
import { API_BASE } from "../../lib/api";

import MessageInputBar from "./MessageInputBar";
import MessageAttachments from "./conversation/MessageAttachments";
import type {
  ChatMessage,
  ConversationViewProps,
  MessagesApiResponse,
} from "./conversation/messages.types";
import { buildTimeline } from "./conversation/timeline";

/* ---------- Types pour le typage strict ---------- */

interface SessionLite {
  token?: string;
}

interface MessageBubbleProps {
  m: ChatMessage;
  isMine: boolean;
  isAdminAuthor: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

/* ---------- Utils ---------- */

async function safeJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  const text = await res.text().catch(() => "");
  throw new Error(`Erreur serveur (${res.status}) : ${text.slice(0, 100)}`);
}

function linkifyText(text: string): React.ReactNode[] {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-violet-400 hover:decoration-violet-600 break-all"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/* ---------- Composant MessageBubble ---------- */

const MessageBubble = React.memo(
  ({ m, isMine, isAdminAuthor, canDelete, onDelete }: MessageBubbleProps) => {
    const content = useMemo(() => linkifyText(m.body), [m.body]);
    const bubbleClass = isMine
      ? "bg-violet-600 text-white rounded-br-md rounded-tr-2xl"
      : "bg-slate-100 dark:bg-[#181b24] text-slate-900 dark:text-slate-100 rounded-bl-md rounded-tl-2xl";

    return (
      <div
        className={`flex w-full ${isMine ? "justify-end" : "justify-start"} gap-3`}
      >
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden shrink-0 grid place-items-center text-[11px]">
            {m.authorAvatar ? (
              <img
                src={m.authorAvatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (m.authorName || "?").slice(0, 2).toUpperCase()
            )}
          </div>
        )}
        <div
          className={`flex flex-col gap-1 max-w-[78%] sm:max-w-[65%] ${isMine ? "items-end" : "items-start"}`}
        >
          {!isMine && (
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {m.authorName || "Membre"}
              </span>
              {isAdminAuthor && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-600/15 text-violet-500 border border-violet-500/40">
                  Admin
                </span>
              )}
            </div>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm relative ${bubbleClass}`}
          >
            {m.body && (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            )}
            <MessageAttachments attachments={m.attachments} />
            {canDelete && (
              <button
                onClick={() => onDelete(m.id)}
                className="absolute -top-2 right-2 rounded-full bg-black/20 hover:bg-black/30 w-6 h-6 text-[10px] grid place-items-center"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    );
  },
);

/* ---------- Composant principal ---------- */

export default function ConversationView({
  conversation,
  mode,
  placeholder,
  showAdminBadge = false,
  isGroupAdmin = false,
  chatLockedForMembers = false,
}: ConversationViewProps) {
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
    [endpoint, fetchMessages],
  );

  return (
    <div className="h-full flex flex-col rounded-xl border border-black/5 bg-white/95 dark:bg-[#111318]/95 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          setUserAtBottom(
            el.scrollHeight - el.scrollTop - el.clientHeight <= 80,
          );
        }}
      >
        {timeline.map((item) =>
          item.kind === "sep" ? (
            <div key={item.id} className="text-center">
              <span className="text-[11px] text-slate-400 bg-black/5 px-3 py-0.5 rounded-full">
                {item.label}
              </span>
            </div>
          ) : (
            <MessageBubble
              key={item.message.id}
              m={item.message}
              isMine={item.message.mine}
              isAdminAuthor={
                showAdminBadge && conversation.adminId === item.message.authorId
              }
              canDelete={
                item.message.mine || (mode === "group" && isGroupAdmin)
              }
              onDelete={handleDeleteMessage}
            />
          ),
        )}
      </div>
      {!chatLockedForMembers ? (
        <MessageInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          sending={sending}
          placeholder={placeholder}
          onPickFiles={() => {}}
          attachments={[]}
          onRemoveAttachment={() => {}}
        />
      ) : (
        <div className="p-3 text-center text-xs text-slate-500 border-t">
          Discussions verrouillées.
        </div>
      )}
    </div>
  );
}
