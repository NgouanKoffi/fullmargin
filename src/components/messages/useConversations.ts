// src/components/messages/useConversations.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

export type ConversationVariant = "private" | "group";

export type Conversation = {
  id: string;
  variant: ConversationVariant;
  name: string;
  avatar?: string;
  lastMsg?: string;
  time?: string;
  timeISO?: string;
  unread?: number;
  adminId?: string;
  membersCount?: number;
};

// 1️⃣ On ajoute les champs updatedAt / created_at au cas où le backend les envoie
type ThreadsApiItem = {
  id: string;
  type: ConversationVariant;
  lastMessageAt?: string | null;
  updatedAt?: string | null; // Ajouté
  updated_at?: string | null; // Ajouté (cas snake_case)
  createdAt?: string | null; // Ajouté
  created_at?: string | null; // Ajouté
  lastMessagePreview?: string | null;
  unreadCount?: number;
  private?: {
    owner?: { id?: string; name?: string; avatar?: string };
    member?: { id?: string; name?: string; avatar?: string };
    community?: { name?: string; logoUrl?: string };
  };
  group?: {
    id?: string;
    name?: string;
    avatar?: string;
    avatarUrl?: string;
    adminId?: string;
    membersCount?: number;
    members_count?: number;
    community?: { name?: string; logoUrl?: string };
  };
};

type ThreadsApiResponse = {
  ok: boolean;
  error?: string;
  data?: {
    items?: ThreadsApiItem[];
  };
};

export type UseConversationsOptions = {
  enabled?: boolean;
  pollMs?: number;
};

function mapThread(item: ThreadsApiItem): Conversation {
  const variant: ConversationVariant =
    item.type === "group" ? "group" : "private";

  // 2️⃣ LOGIQUE INTELLIGENTE POUR LA DATE :
  // On récupère toutes les dates possibles envoyées par le serveur
  // et on prend la plus récente (MAX).
  const potentialDates = [
    item.lastMessageAt,
    item.updatedAt,
    item.updated_at,
    item.createdAt,
    item.created_at,
  ]
    .filter((d): d is string => !!d) // garde seulement les chaines non nulles
    .map((d) => new Date(d).getTime()) // convertit en timestamp
    .filter((t) => !isNaN(t)); // garde seulement les dates valides

  let timeISO: string | null = null;

  if (potentialDates.length > 0) {
    const maxDate = Math.max(...potentialDates);
    timeISO = new Date(maxDate).toISOString();
  }

  // Formatage de l'heure pour l'affichage (ex: "11:04")
  const time =
    timeISO != null
      ? new Date(timeISO).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const unread = item.unreadCount ?? 0;

  // ====== GROUPES ======
  if (variant === "group" && item.group) {
    const g = item.group;
    const membersCount = g.membersCount ?? g.members_count ?? 0;
    const avatar = g.avatar || g.avatarUrl || g.community?.logoUrl || undefined;

    return {
      id: g.id || item.id,
      variant: "group",
      name: g.name || "Groupe",
      avatar,
      lastMsg: item.lastMessagePreview || "",
      time,
      timeISO: timeISO || undefined, // C'est celle-ci qui servira au tri
      unread,
      adminId: g.adminId,
      membersCount,
    };
  }

  // ====== PRIVÉ ======
  const p = item.private ?? {};
  const owner = p.owner ?? {};
  const member = p.member ?? {};
  const target = member.name ? member : owner;

  return {
    id: item.id,
    variant: "private",
    name: target.name || "Discussion privée",
    avatar: target.avatar || p.community?.logoUrl,
    lastMsg: item.lastMessagePreview || "",
    time,
    timeISO: timeISO || undefined,
    unread,
    adminId: owner.id,
  };
}

export function useConversations(options: UseConversationsOptions = {}): {
  items: Conversation[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { enabled = true, pollMs = 0 } = options;

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const makeHeaders = useCallback((): HeadersInit => {
    const tok = loadSession()?.token || "";
    const h: Record<string, string> = {};
    if (tok) h.Authorization = `Bearer ${tok}`;
    return h;
  }, []);

  const fetchThreads = useCallback(
    async (initial: boolean) => {
      if (!enabled) return;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        if (initial) {
          setLoading(true);
          setError(null);
        } else {
          setRefreshing(true);
        }

        const res = await fetch(`${API_BASE}/communaute/discussions/threads`, {
          method: "GET",
          headers: makeHeaders(),
          signal: ctrl.signal,
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `Réponse non JSON (${res.status}) : ${txt.slice(0, 120)}`,
          );
        }

        const json = (await res.json()) as ThreadsApiResponse;

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Impossible de charger les messages.");
        }

        const rawItems = json.data?.items ?? [];
        const mapped = rawItems.map(mapThread);
        setItems(mapped);
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("[useConversations] erreur:", err);
        setError((err as Error).message || "Erreur inconnue.");
      } finally {
        if (initial) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [enabled, makeHeaders],
  );

  useEffect(() => {
    if (!enabled) return;

    void fetchThreads(true);

    if (!pollMs || pollMs <= 0) {
      return () => {
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
      };
    }

    const id = setInterval(() => {
      void fetchThreads(false);
    }, pollMs);

    return () => {
      clearInterval(id);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [enabled, pollMs, fetchThreads]);

  const refetch = useCallback(() => {
    if (!enabled) return;
    void fetchThreads(false);
  }, [enabled, fetchThreads]);

  return { items, loading, refreshing, error, refetch };
}
