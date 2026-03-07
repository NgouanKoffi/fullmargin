import type { Conversation } from "./useConversations";
import ConversationView from "./ConversationView";

type Props = {
  conversation: Conversation;
  isDesktop: boolean; // gardé pour compat
};

export default function PrivateConversationView({ conversation }: Props) {
  return (
    <ConversationView
      conversation={conversation}
      mode="private"
      placeholder="Écrire un message…"
      showAdminBadge={false}
    />
  );
}
