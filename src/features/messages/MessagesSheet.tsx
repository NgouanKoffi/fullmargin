import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import clsx from "clsx";

import type { Conversation } from "./useConversations";
import ConversationView from "./ConversationView";

import { useIsDesktop } from "./hooks/useIsDesktop";
import { useLockBody } from "./hooks/useLockBody";
import { useGroupMeta } from "./hooks/useGroupMeta";

import { MessagesHeader } from "./MessagesHeader";
import { FriendlyIssue } from "./sheet/FriendlyIssue";
import { ConversationList } from "./sheet/ConversationList";
import { GroupSettingsModal } from "./sheet/GroupSettingsModal";

import { useMessagesSheet } from "./hooks/useMessagesSheet";
import { useMessagesInterceptor } from "./hooks/useMessagesInterceptor";
import { useGroupSettings } from "./hooks/useGroupSettings";

export type MessagesSheetProps = {
  open: boolean;
  onClose: () => void;
  items?: Conversation[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  onRetry?: () => void;
};

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

  // State Hook
  const {
    activeTab, setActiveTab,
    q, setQ,
    activeConv, setActiveConv,
    locallyReadIds, setLocallyReadIds,
    privates, groups,
    privateUnreadTotal, groupUnreadTotal,
    handleSelectConv, handleBackFromThread,
  } = useMessagesSheet(open, items, onRetry);

  // Global Interceptor Hook
  useMessagesInterceptor(setActiveTab, setActiveConv, setLocallyReadIds);

  const { groupMeta, membersCount, headerAvatarUrl } = useGroupMeta(activeConv);
  const isGroupAdmin = !!groupMeta?.isAdmin;
  const isGroup = activeConv?.variant === "group";

  // Group Settings Hook
  const {
    groupSettingsOpen,
    setGroupSettingsOpen,
    groupChatLocked,
    chatLockedForMembers,
    handleOpenGroupSettings,
    handleToggleGroupLock,
  } = useGroupSettings(
    activeConv,
    isGroup,
    isGroupAdmin,
    groupMeta?.onlyAdminsCanPost,
    open
  );

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
              "shadow-2xl flex flex-col overflow-hidden"
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
                        : "opacity-70 hover:opacity-100"
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
                        : "opacity-70 hover:opacity-100"
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
              {isGroup && isGroupAdmin && (
                <GroupSettingsModal
                  groupSettingsOpen={groupSettingsOpen}
                  setGroupSettingsOpen={setGroupSettingsOpen}
                  groupChatLocked={groupChatLocked}
                  handleToggleGroupLock={handleToggleGroupLock}
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
