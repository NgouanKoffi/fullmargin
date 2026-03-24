import type { Notification, NotificationCategory } from "../constants";

export const getNotificationCategory = (kind: string): NotificationCategory => {
  if (kind === "admin_role_granted" || kind === "admin_role_revoked")
    return "roles";

  if (
    [
      "course_sale_made",
      "community_course_created",
      "community_course_enrolled",
      "community_course_unenrolled",
      "course_manual_enrollment",
      "course_manual_unenrollment",
    ].includes(kind)
  )
    return "courses";

  if (kind.startsWith("community_") || kind === "warning_issued") return "community";
  if (kind.startsWith("marketplace_")) return "marketplace";
  if (kind.startsWith("fmmetrix_") || kind.startsWith("fmmetrix."))
    return "fmmetrix";
  if (kind.startsWith("finance_")) return "finance";
  if (kind.startsWith("admin_")) return "admin";
  if (
    kind === "group_manual_add_member" ||
    kind === "group_manual_remove_member"
  )
    return "community";

  return "community";
};

export const getNotificationTitle = (notif: Notification): string => {
  const { kind, payload = {} } = notif;
  const communityName = payload.communityName || "votre communauté";
  const productName = payload.productName || "Votre produit";

  switch (kind) {
    case "admin_role_granted":
      return `🛡️ Vous avez été promu administrateur ! Déconnectez-vous puis reconnectez-vous pour activer vos accès.`;
    case "admin_role_revoked":
      return `🔒 Vos accès administrateur ont été retirés. Déconnectez-vous puis reconnectez-vous pour mettre à jour votre espace.`;

    case "community_member_joined":
      return `${payload.joinedUserName || "Un nouveau membre"} a rejoint ${communityName}`;
    case "community_member_left":
      return `${payload.leftUserName || "Un membre"} a quitté ${communityName}`;
    case "community_post_created":
      return `${payload.fromUserName || "Un membre"} a publié dans ${communityName}`;
    case "community_post_created_admin":
      return `${payload.fromUserName || "L'admin"} a publié dans ${communityName}`;
    case "community_post_commented":
      return `${payload.fromUserName || "Quelqu'un"} a commenté dans ${communityName}`;
    case "community_comment_replied":
      return `${payload.fromUserName || "Quelqu'un"} vous a répondu dans ${communityName}`;
    case "community_post_liked":
      return `${payload.fromUserName || "Quelqu'un"} a aimé votre publication dans ${communityName}`;
    case "community_request_received":
      return `${payload.requesterName || "Un utilisateur"} demande à rejoindre ${communityName}`;
    case "community_request_approved":
      return `Votre demande pour ${communityName} a été approuvée`;
    case "community_request_rejected":
      return `Votre demande pour ${communityName} a été refusée`;
    case "community_deletion_requested":
      return `🗑️ ${payload.ownerName || "Un propriétaire"} demande la suppression de sa communauté${payload.communityName ? ` "${payload.communityName}"` : ""}`;
    case "community_deletion_rejected":
      return `↩️ La demande de suppression de "${payload.communityName || communityName}" a été refusée`;
    case "community_post_deleted_by_admin":
      return `⚠️ Votre publication dans ${communityName} a été supprimée par la modération. Motif : "${payload.reason || "Non-respect des règles"}"`;
    case "community_comment_deleted":
      return `Votre commentaire dans ${communityName} a été supprimée`;
    case "community_group_created":
      return `${payload.fromUserName || "L'admin"} a créé un groupe dans ${communityName}`;
    case "community_group_member_added":
      return `Vous avez été ajouté à un groupe de ${communityName}`;
    case "community_group_member_removed":
      return `Vous avez été retiré d'un groupe de ${communityName}`;
    case "community_course_created":
      return `🎓 ${payload.fromUserName || "L'admin"} a créé une formation dans ${communityName}`;
    case "community_course_enrolled":
      return `🎓 Vous avez été inscrit à une formation de ${communityName}`;
    case "community_course_unenrolled":
      return `Vous avez été désinscrit d'une formation de ${communityName}`;
    case "course_manual_enrollment":
      return `🎓 Tu as reçu l'accès à la formation "${payload.courseTitle || "Formation"}"`;
    case "course_manual_unenrollment":
      return `Ton accès à la formation "${payload.courseTitle || "Formation"}" a été retiré`;
    case "course_sale_made":
      return `💰 Nouvelle vente : ${payload.courseTitle || "Formation"}`;
    case "community_course_deleted_by_admin":
      return `⚠️ Votre formation "${payload.courseTitle}" a été suspendue. Motif : "${payload.reason || "Non-respect des règles"}"`;
    case "community_live_scheduled":
      return `📅 Live programmé dans ${communityName} — Voir le détail`;
    case "community_live_started":
      return `🔴 Un live est en cours dans ${communityName} — Rejoindre`;
    case "group_manual_add_member":
      return `Tu as été ajouté au groupe "${payload.groupName || "Groupe"}" dans ${communityName}`;
    case "group_manual_remove_member":
      return `Tu as été retiré du groupe "${payload.groupName || "Groupe"}" dans ${communityName}`;
    case "community_deleted_by_admin":
      return `🚨 Votre communauté "${payload.communityName}" a été fermée par un administrateur. Motif : "${payload.reason || "Non-respect des règles"}"`;
    case "community_deleted":
      return `🚨 La suppression de votre communauté a été approuvée.`;
    case "community_restored":
      return `✅ Votre communauté "${communityName}" a été restaurée.`;
    case "warning_issued":
      return `⚠️ Avertissement (${payload.warningCount}/3) pour "${communityName}": ${payload.reason}`;
    case "community_deleted_due_to_warnings":
      return `🚨 Votre communauté "${communityName}" a été supprimée suite à des avertissements répétés.`;
    case "marketplace_product_submitted":
      return `${productName} soumis pour validation`;
    case "marketplace_product_approved":
      return `✅ ${productName} approuvé`;
    case "marketplace_product_rejected":
      return `❌ ${productName} refusé`;
    case "marketplace_sale_made":
      return `💰 Nouvelle vente : ${payload.productTitle || "Produit"}`;
    case "marketplace_purchase_made":
      return `Achat effectué`;
    case "marketplace_payment_rejected":
      return `❌ Paiement refusé (Marketplace)`;
    case "finance_withdrawal_requested":
      return `Retrait demandé`;
    case "finance_withdrawal_approved":
      return `✅ Retrait approuvé`;
    case "finance_withdrawal_rejected":
      return `❌ Retrait refusé`;
    case "fmmetrix.manual_grant":
      return `✨ Un accès FM-Metrix Premium vous a été accordé manuellement.`;
    case "fmmetrix.premium_activated":
    case "fmmetrix_subscription_granted":
      return `🎉 Votre compte est désormais Premium sur FM-Metrix.`;
    case "fmmetrix.subscription_expiring":
    case "fmmetrix_subscription_expiring":
      return `⏳ Expiration imminente de votre abonnement FM-Metrix.`;
    case "fmmetrix_payment_rejected":
      return `❌ Paiement refusé (FM Metrix)`;
    case "fmmetrix_subscription_expired":
    case "fmmetrix.subscription_expired":
    case "fmmetrix_subscription_cancelled":
    case "fmmetrix.subscription_cancelled":
    case "fmmetrix.subscription_canceled":
      return `❌ Votre abonnement FM-Metrix Premium a été résilié.`;
    case "fmmetrix_subscription_renewed":
    case "fmmetrix.subscription_renewed":
      return `🔄 Votre abonnement FM-Metrix Premium a été renouvelé.`;
    case "admin_withdrawal_pending":
      return `Demande de retrait — ${payload.userName || "Un utilisateur"}`;
    case "admin_product_pending":
      return `Nouveau produit à valider — ${payload.sellerName || "Un vendeur"}`;
    case "admin_fmmetrix_crypto_pending":
      return `Paiement Crypto (FM Metrix) — ${payload.userName || "Un client"}`;
    case "admin_marketplace_crypto_pending":
      return `Paiement Crypto (Marketplace) — ${payload.userName || "Un client"}`;
    default:
      return `Notification (${kind})`;
  }
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
};
