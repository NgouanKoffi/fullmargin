// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\messages\GroupConversationView.tsx
import type { Conversation } from "./useConversations";
import ConversationView from "./ConversationView";

type Props = {
  conversation: Conversation;
  isDesktop: boolean; // gardé pour compat
};

export default function GroupConversationView({ conversation }: Props) {
  return (
    <ConversationView
      conversation={conversation}
      mode="group"
      placeholder="Écrire un message pour le groupe…"
      showAdminBadge={true}
    />
  );
}
