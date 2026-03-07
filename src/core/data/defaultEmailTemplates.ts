// C:\Users\ADMIN\Desktop\fullmargin-site\src\data\defaultEmailTemplates.ts

export type EmailTemplate = {
  /** Identifiant stable (slug) utilisé par le backend */
  id: string;
  /** Intitulé lisible pour l'administration */
  name: string;
  /** Brève description de l’usage */
  description: string;
  /** Sujet par défaut (supporte les variables {{...}}) */
  subject: string;
  /** HTML par défaut (supporte les variables {{...}}) */
  html: string;
};

/**
 * Modèles d’e-mail par défaut alignés sur backend/src/utils/mailer.js.
 */
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  /* ===================== 🔐 AUTH & BIENVENUE ===================== */
  {
    id: "auth.login_code",
    name: "Code de connexion (2FA)",
    description: "Code à usage unique envoyé lors de la connexion locale.",
    subject: "Votre code de connexion {{app.name}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111">
  <p>Bonjour,</p>
  <p>Votre code de connexion est :</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">{{code}}</div>
  <p>Il expire dans <b>2 minutes</b>.</p>
  <p>— {{app.name}}</p>
</div>`.trim(),
  },
  {
    id: "auth.welcome",
    name: "Bienvenue",
    description: "Envoyé après la création réussie d'un compte.",
    subject: "Bienvenue sur {{app.name}} 🚀",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
  <p>Bonjour {{user.firstName}},</p>
  <p>Ton compte <b>{{app.name}}</b> est prêt 🎉</p>
  <p>Tu peux dès maintenant te connecter et découvrir l'application.</p>
  <p style="margin:16px 0">
    <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Ouvrir {{app.name}}</a>
  </p>
  <p>— L’équipe {{app.name}}</p>
</div>`.trim(),
  },
  {
    id: "auth.password_reset_code",
    name: "Réinitialisation du mot de passe",
    description: "Code envoyé suite à une demande de mot de passe oublié.",
    subject: "Réinitialisation de votre mot de passe",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111">
  <p>Bonjour,</p>
  <p>Voici votre code pour réinitialiser votre mot de passe :</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">{{code}}</div>
  <p>Il expire dans <b>{{minutes}} minutes</b>.</p>
  <p>— {{app.name}}</p>
</div>`.trim(),
  },

  /* ===================== 🛠️ SERVICES & ROLES ===================== */
  {
    id: "service.membership_update",
    name: "Mise à jour des rôles/accès",
    description:
      "Notifie l'utilisateur de l'ajout ou du retrait de rôles/services.",
    subject: "Mise à jour de vos accès sur {{app.name}}",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111">
  <p>Bonjour {{user.firstName}},</p>
  <p>Vos accès sur la plateforme ont été mis à jour par un administrateur.</p>
  {{#if addedNames}} <p>✅ Ajouts : <b>{{addedNames}}</b></p> {{/if}}
  {{#if removedNames}} <p>❌ Retraits : <b>{{removedNames}}</b></p> {{/if}}
  <p>— L'équipe {{app.name}}</p>
</div>`.trim(),
  },
  {
    id: "service.deleted",
    name: "Service supprimé",
    description: "Notifie la suppression complète d'un service spécifique.",
    subject: "Information concernant votre service {{service.name}}",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111">
  <p>Bonjour {{user.firstName}},</p>
  <p>Nous vous informons que votre accès au service <b>{{service.name}}</b> a été révoqué.</p>
  <p>— L'équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ===================== 🛒 MARKETPLACE CLIENT ===================== */
  {
    id: "marketplace.license_issued",
    name: "Licence délivrée (achat)",
    description: "Délivrance de la clé de licence après achat.",
    subject: "Votre licence pour {{product.title}} — {{app.name}}",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800">Félicitations pour votre achat, {{user.firstName}} 🎉</p>
  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0">
    <p><b>Produit :</b> {{product.title}}</p>
    <p><b>Clé de licence :</b></p>
    <div style="font-size:18px;font-weight:800;background:#fff;border:1px dashed #cbd5e1;padding:12px;border-radius:12px;display:inline-block">{{license.key}}</div>
    <p style="margin-top:10px"><b>Expire le :</b> {{license.expiresAt}}</p>
  </div>
  <p><a href="{{support.whatsappUrl}}" style="color:#25D366;font-weight:bold">Support WhatsApp</a></p>
</div>`.trim(),
  },
  {
    id: "marketplace.order_success",
    name: "Commande confirmée",
    description: "Email générique de succès de commande.",
    subject: "Confirmation de commande : {{product.title}}",
    html: `<p>Bonjour {{user.firstName}}, votre commande pour <b>{{product.title}}</b> a été validée avec succès !</p>`.trim(),
  },
  {
    id: "marketplace.crypto_approved",
    name: "Paiement Crypto validé",
    description: "Notification après validation manuelle d'un paiement crypto.",
    subject: "Paiement Crypto validé ✅ — {{product.title}}",
    html: `<p>Bonjour {{user.firstName}}, votre paiement crypto pour <b>{{product.title}}</b> a été approuvé.</p>`.trim(),
  },
  {
    id: "marketplace.crypto_rejected",
    name: "Paiement Crypto refusé",
    description: "Notification de refus d'un paiement crypto avec motif.",
    subject: "Paiement Crypto refusé ❌ — {{product.title}}",
    html: `<p>Bonjour {{user.firstName}}, votre paiement pour <b>{{product.title}}</b> n'a pas pu être validé.</p><p>Motif : {{reason}}</p>`.trim(),
  },

  /* ===================== 💰 NOTIFICATIONS VENDEURS ===================== */
  {
    id: "marketplace.sale_notification",
    name: "Vente Marketplace (Vendeur)",
    description: "Alerte de vente pour un vendeur de la marketplace.",
    subject: "Nouvelle vente sur la Marketplace ! 💰",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111">
  <p>Félicitations, vous avez réalisé une vente !</p>
  <p><b>Client :</b> {{customer.name}}</p>
  <p><b>Gains :</b> {{totalEarnings}}</p>
</div>`.trim(),
  },
  {
    id: "course.sale_notification",
    name: "Vente de Formation (Formateur)",
    description: "Alerte de vente pour le créateur d'une formation.",
    subject: "Nouvelle inscription à votre formation ! 🎓",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111">
  <p>Bonjour,</p>
  <p><b>{{buyer.name}}</b> vient de s'inscrire à votre formation : <b>{{course.title}}</b>.</p>
  <p>Gains nets crédités : <b>{{earnings}}</b></p>
</div>`.trim(),
  },

  /* ===================== 💸 FINANCE & RETRAITS ===================== */
  {
    id: "finance.withdrawal_approved",
    name: "Retrait approuvé",
    description: "Confirmation de traitement d'une demande de retrait.",
    subject: "Votre demande de retrait est validée 💸",
    html: `
<div style="font-family:Inter,sans-serif;font-size:16px;color:#111">
  <p>Bonjour {{user.firstName}},</p>
  <p>Votre retrait de <b>{{withdrawal.amountNet}}</b> a été effectué via <b>{{withdrawal.method}}</b>.</p>
  {{#if withdrawal.hasProof}} <p><a href="{{withdrawal.proofUrl}}">Voir la preuve de virement</a></p> {{/if}}
  <p>Référence : {{withdrawal.reference}}</p>
</div>`.trim(),
  },
  {
    id: "finance.withdrawal_rejected",
    name: "Retrait refusé",
    description: "Notification de refus de retrait avec motif.",
    subject: "Votre demande de retrait a été refusée ⚠️",
    html: `<p>Votre retrait de {{withdrawal.amountNet}} a été refusé. Motif : {{withdrawal.reason}}</p>`.trim(),
  },

  /* ===================== 📈 FM METRIX ===================== */
  {
    id: "fmmetrix.premium_activated",
    name: "FM Metrix : Premium activé",
    description: "Confirmation d'activation de l'abonnement Premium.",
    subject: "Bienvenue dans FM-Metrix Premium 📈",
    html: `<p>Bonjour {{user.firstName}}, votre accès Premium est actif jusqu'au {{sub.validUntil}}.</p>`.trim(),
  },
  {
    id: "fmmetrix.subscription_expiring",
    name: "FM Metrix : Expiration imminente",
    description: "Rappel automatique envoyé quelques jours avant la fin.",
    subject: "Votre abonnement FM-Metrix expire bientôt ⏳",
    html: `<p>Il vous reste {{sub.daysLeft}} jours avant expiration (le {{sub.validUntil}}).</p>`.trim(),
  },
  {
    id: "fmmetrix.subscription_expired",
    name: "FM Metrix : Expiré",
    description: "Notification de fin d'abonnement.",
    subject: "Votre accès Premium FM-Metrix a expiré 🛑",
    html: `<p>Votre abonnement Premium a pris fin le {{sub.validUntil}}.</p>`.trim(),
  },
  {
    id: "fmmetrix.manual_grant",
    name: "FM Metrix : Accès manuel",
    description: "Email envoyé lorsqu'un admin offre des mois d'accès.",
    subject: "Accès Premium FM-Metrix accordé 🎁",
    html: `<p>L'administrateur {{sub.adminEmail}} vous a accordé {{sub.months}} mois d'accès gratuit.</p>`.trim(),
  },
  {
    id: "fmmetrix.subscription_canceled",
    name: "FM Metrix : Résiliation",
    description: "Confirmation d'annulation de l'abonnement.",
    subject: "Confirmation de résiliation FM-Metrix ❌",
    html: `<p>Votre abonnement prendra fin le {{sub.endedAt}}. Motif : {{sub.reason}}</p>`.trim(),
  },
];

export default DEFAULT_EMAIL_TEMPLATES;
