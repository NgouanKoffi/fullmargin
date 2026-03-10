// src/components/messages/MessagesMount.tsx
import { useEffect, useState, useCallback } from "react";
import MessagesSheet from "./MessagesSheet";
import { useConversations } from "./useConversations";

export default function MessagesMount() {
  const [open, setOpen] = useState(false);

  // ✅ AJOUT DE pollMs : On rafraîchit la liste toutes les 3s quand c'est ouvert.
  // Cela permet de récupérer les nouveaux "lastMessageAt" et de faire remonter
  // les conversations actives tout en haut grâce au tri dans MessagesSheet.
  const { items, loading, refreshing, error, refetch } = useConversations({
    enabled: open,
    pollMs: 3000,
  });

  const onOpen = useCallback(() => {
    setOpen(true);
    // refetch juste après ouverture pour être sûr d'être à jour
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch]);

  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener("fm:open-messages", handler as EventListener);
    return () =>
      window.removeEventListener("fm:open-messages", handler as EventListener);
  }, [onOpen]);

  return (
    <MessagesSheet
      open={open}
      onClose={onClose}
      items={items}
      loading={loading}
      refreshing={refreshing}
      error={error || undefined}
      onRetry={refetch}
    />
  );
}
