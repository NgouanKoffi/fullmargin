import type { ConversationViewProps } from "./conversation/messages.types";
import MessageInputBar from "./MessageInputBar";
import { MessageBubble } from "./conversation/MessageBubble";
import { useConversationMessages } from "./hooks/useConversationMessages";

export default function ConversationView({
  conversation,
  mode,
  placeholder,
  showAdminBadge = false,
  isGroupAdmin = false,
  chatLockedForMembers = false,
}: ConversationViewProps) {
  const {
    sending,
    input,
    setInput,
    scrollContainerRef,
    timeline,
    handleSend,
    handleDeleteMessage,
    handleScroll,
  } = useConversationMessages(conversation, mode);

  return (
    <div className="h-full flex flex-col rounded-xl border border-black/5 bg-white/95 dark:bg-[#111318]/95 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar"
        onScroll={handleScroll}
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
          )
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
