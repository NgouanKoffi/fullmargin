// src/components/messages/MessagesSheet.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import clsx from "clsx";

import type { Conversation } from "./useConversations";
import ConversationView from "./ConversationView";

import { useIsDesktop } from "./hooks/useIsDesktop";
import { useLockBody } from "./hooks/useLockBody";
import { useGroupMeta } from "./hooks/useGroupMeta";

import { MessagesHeader } from "./MessagesHeader";
import { FriendlyIssue } from "./sheet/FriendlyIssue";
import { ConversationList } from "./sheet/ConversationList";
import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";

export type MessagesSheetProps = {
  open: boolean;
  onClose: () => void;
  items?: Conversation[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  onRetry?: () => void;
};

// ✅ TabKey limité à Privés et Groupes
type TabKey = "private" | "group";

export default function MessagesSheet({
  open,
  onClose,
  items = [],
  loading = false,
  error,
  onRetry,
}: MessagesSheetProps) {
  const isDesktop = useIsDesktop(1100);
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelWidth = isDesktop ? "min(720px, 45vw)" : "100vw";

  // ✅ Par défaut sur "private"
  const [activeTab, setActiveTab] = useState<TabKey>("private");
  const [q, setQ] = useState("");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([]);

  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupChatLocked, setGroupChatLocked] = useState(false);

  // TRI : Les plus récents en haut
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.timeISO ? new Date(a.timeISO).getTime() : 0;
      const dateB = b.timeISO ? new Date(b.timeISO).getTime() : 0;
      return dateB - dateA;
    });
  }, [items]);

  // Listes filtrées pour l'affichage
  const allFiltered = useMemo(
    () =>
      sortedItems.filter((x) =>
        q.trim()
          ? (x.name || "").toLowerCase().includes(q.trim().toLowerCase())
          : true,
      ),
    [sortedItems, q],
  );

  const privates = useMemo(
    () => allFiltered.filter((x) => x.variant === "private"),
    [allFiltered],
  );

  const groups = useMemo(
    () => allFiltered.filter((x) => x.variant === "group"),
    [allFiltered],
  );

  // ✅ COMPTEURS GLOBAUX (ne dépendent pas de la recherche pour rester visibles)
  const privateUnreadTotal = useMemo(
    () =>
      sortedItems
        .filter((x) => x.variant === "private")
        .reduce((sum, c) => {
          const isLocallyRead = locallyReadIds.includes(c.id);
          return sum + (isLocallyRead ? 0 : (c.unread ?? 0));
        }, 0),
    [sortedItems, locallyReadIds],
  );

  const groupUnreadTotal = useMemo(
    () =>
      sortedItems
        .filter((x) => x.variant === "group")
        .reduce((sum, c) => {
          const isLocallyRead = locallyReadIds.includes(c.id);
          return sum + (isLocallyRead ? 0 : (c.unread ?? 0));
        }, 0),
    [sortedItems, locallyReadIds],
  );

  useEffect(() => {
    if (!activeConv) return;
    if (activeTab === "private" && activeConv.variant !== "private") {
      setActiveConv(null);
    }
    if (activeTab === "group" && activeConv.variant !== "group") {
      setActiveConv(null);
    }
  }, [activeTab, activeConv]);

  const handleSelectConv = (c: Conversation) => {
    setActiveConv(c);
    setLocallyReadIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
  };

  const handleBackFromThread = () => {
    setActiveConv(null);
    if (onRetry) onRetry();
  };

  useEffect(() => {
    if (!open) {
      setActiveConv(null);
      setLocallyReadIds([]);
      setQ("");
      setActiveTab("private");
      setGroupSettingsOpen(false);
      setGroupChatLocked(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        groupId: string;
        name?: string;
        avatar?: string;
      }>;
      if (!custom.detail) return;
      const { groupId, name, avatar } = custom.detail;

      setActiveTab("group");
      setActiveConv({
        id: groupId,
        name: name || "",
        avatar,
        variant: "group",
      });
      setLocallyReadIds((prev) =>
        prev.includes(groupId) ? prev : [...prev, groupId],
      );
    };
    window.addEventListener("fm:open-messages", handler as EventListener);
    return () => {
      window.removeEventListener("fm:open-messages", handler as EventListener);
    };
  }, []);

  const { groupMeta, membersCount, headerAvatarUrl } = useGroupMeta(activeConv);
  const isGroupAdmin = !!groupMeta?.isAdmin;
  const isGroup = activeConv?.variant === "group";

  useEffect(() => {
    if (!isGroup) {
      setGroupChatLocked(false);
      return;
    }
    setGroupChatLocked(!!groupMeta?.onlyAdminsCanPost);
  }, [isGroup, groupMeta?.onlyAdminsCanPost]);

  const chatLockedForMembers = isGroup && groupChatLocked && !isGroupAdmin;

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
        `${base}/communaute/discussions/groups/${encodeURIComponent(activeConv.id)}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ onlyAdminsCanPost: next }),
        },
      );
      if (!res.ok) throw new Error(`Erreur API (${res.status})`);
    } catch (e) {
      console.error("[MessagesSheet] toggle group lock failed:", e);
      setGroupChatLocked((prev) => !prev);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            key="panel"
            className={clsx(
              "fixed z-[151] top-0 left-0 h-dvh",
              "bg-white/98 dark:bg-[#0f1115]/98",
              "backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10",
              "shadow-2xl flex flex-col overflow-hidden",
            )}
            style={{ width: panelWidth }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            aria-label="Messages"
          >
            <MessagesHeader
              activeConv={activeConv}
              membersCount={membersCount}
              isGroupAdmin={isGroupAdmin}
              headerAvatarUrl={headerAvatarUrl || ""}
              onBackFromThread={handleBackFromThread}
              onClose={onClose}
              onOpenGroupSettings={handleOpenGroupSettings}
            />

            {!activeConv && (
              <div className="px-4 sm:px-5 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-60" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher une discussion"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#111318]/60"
                  />
                </div>
              </div>
            )}

            {/* ✅ ONGLETS : Seulement Privés et Groupes avec badges violets */}
            {!activeConv && (
              <div className="px-3 sm:px-5">
                <div className="inline-flex rounded-xl p-1 bg-black/[0.04] dark:bg-white/[0.06] ring-1 ring-black/10 dark:ring-white/10 overflow-x-auto max-w-full no-scrollbar">
                  {/* Bouton PRIVÉS */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("private")}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-lg whitespace-nowrap flex items-center",
                      activeTab === "private"
                        ? "bg-white dark:bg-[#151821] shadow ring-1 ring-black/10 dark:ring-white/10 font-medium"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    Privés
                    {privateUnreadTotal > 0 && (
                      <span className="ml-1.5 text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {privateUnreadTotal}
                      </span>
                    )}
                  </button>

                  {/* Bouton GROUPES */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("group")}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ml-1 flex items-center",
                      activeTab === "group"
                        ? "bg-white dark:bg-[#151821] shadow ring-1 ring-black/10 dark:ring-white/10 font-medium"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    Groupes
                    {groupUnreadTotal > 0 && (
                      <span className="ml-1.5 text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {groupUnreadTotal}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden px-2 sm:px-3 pb-4 relative">
              {loading && !activeConv && (
                <div className="overflow-y-auto h-full no-scrollbar px-2 pt-2 space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="h-10 w-10 rounded-full bg-black/5 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded bg-black/5 dark:bg-white/10" />
                        <div className="h-3 w-2/3 rounded bg-black/5 dark:bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && !activeConv && (
                <FriendlyIssue onRetry={onRetry} />
              )}

              {!loading && !error && !activeConv && (
                <div className="flex-1 overflow-y-auto h-full no-scrollbar pt-2">
                  <ConversationList
                    items={activeTab === "private" ? privates : groups}
                    onSelect={handleSelectConv}
                    locallyReadIds={locallyReadIds}
                  />
                </div>
              )}

              {activeConv && (
                <div className="h-full flex flex-col">
                  <ConversationView
                    conversation={activeConv}
                    mode={
                      activeConv.variant === "private" ? "private" : "group"
                    }
                    placeholder={
                      activeConv.variant === "private"
                        ? "Écrire un message…"
                        : "Écrire un message pour le groupe…"
                    }
                    showAdminBadge={activeConv.variant === "group"}
                    isGroupAdmin={isGroupAdmin}
                    chatLockedForMembers={chatLockedForMembers}
                  />
                </div>
              )}

              {/* Paramètres groupe */}
              {isGroup && isGroupAdmin && groupSettingsOpen && (
                <div
                  className="absolute inset-0 z-20 flex justify-end bg-black/40 backdrop-blur-[2px]"
                  onClick={() => setGroupSettingsOpen(false)}
                >
                  <div
                    className="h-full w-full max-w-sm bg-white dark:bg-[#111318] border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          Paramètres du groupe
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Contrôle qui peut envoyer des messages.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroupSettingsOpen(false)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-sm">
                      <div className="flex items-center gap-3 pr-1">
                        <div className="flex-1">
                          <div className="font-medium">
                            Limiter l’écriture aux administrateurs
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Seuls les admins peuvent envoyer des messages quand
                            activé.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={groupChatLocked}
                          onClick={handleToggleGroupLock}
                          className={clsx(
                            "relative inline-flex h-6 w-11 rounded-full border transition-colors duration-150 shrink-0",
                            groupChatLocked
                              ? "bg-violet-600 border-violet-600"
                              : "bg-slate-300/70 dark:bg-slate-600/70 border-transparent",
                          )}
                        >
                          <span
                            className={clsx(
                              "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-150",
                              groupChatLocked
                                ? "translate-x-5"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
