// backend/src/utils/mailer.defaults.js
const DEFAULTS = {
  "auth.login_code": {
    subject: "Votre code de connexion",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111">
  <p>Bonjour,</p>
  <p>Votre code de connexion est :</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">{{code}}</div>
  <p>Il expire dans <b>2 minutes</b>.</p>
  <p>— {{app.name}}</p>
</div>`.trim(),
  },

  "auth.welcome": {
    subject: "Bienvenue sur {{app.name}} 🚀",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
  <p>Bonjour {{user.firstName}},</p>
  <p>Ton compte <b>{{app.name}}</b> est prêt 🎉</p>
  <p>Tu peux dès maintenant te connecter et découvrir l'application.</p>
  <p style="margin:16px 0">
    <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
      Ouvrir {{app.name}}
    </a>
  </p>
  <p style="font-size:14px;color:#555">Si tu n’es pas à l’origine de cette inscription, ignore simplement cet email.</p>
  <p>— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "auth.password_reset_code": {
    subject: "Réinitialisation du mot de passe",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111">
  <p>Bonjour,</p>
  <p>Voici votre code pour réinitialiser votre mot de passe :</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">{{code}}</div>
  <p>Il expire dans <b>{{minutes}} minutes</b>.</p>
  <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  <p>— {{app.name}}</p>
</div>`.trim(),
  },

  //   "service.membership_update": {
  //     subject: "Affectations de service — mise à jour",
  //     html: `
  // <div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
  //   <p>Bonjour {{user.firstName}}!</p>
  //   <p>Vos affectations de service viennent d'être mises à jour.</p>
  //   {{#addedNames.length}}
  //     <p style="margin:8px 0"><b>Ajouté(s) :</b></p>
  //     <ul>{{addedNames}}</ul>
  //   {{/addedNames.length}}
  //   {{#removedNames.length}}
  //     <p style="margin:12px 0"><b>Retiré(s) :</b></p>
  //     <ul>{{removedNames}}</ul>
  //   {{/removedNames.length}}
  //   {{#becameAgent}}
  //     <p style="margin:12px 0"><b>Vous avez été promu(e) au grade « agent »</b>.</p>
  //   {{/becameAgent}}
  //   {{#lostAgent}}
  //     <p style="margin:12px 0"><b>Vous n'êtes plus « agent »</b>.</p>
  //   {{/lostAgent}}
  //   <p style="margin:16px 0">
  //     <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
  //       Ouvrir {{app.name}}
  //     </a>
  //   </p>
  //   <p style="font-size:14px;color:#555">Si vous pensez qu'il s'agit d'une erreur, merci de répondre à cet email.</p>
  //   <p>— L’équipe {{app.name}}</p>
  // </div>`.trim(),
  //   },

  //   "service.deleted": {
  //     subject: "Service supprimé — {{service.name}}",
  //     html: `
  // <div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
  //   <p>Bonjour {{user.firstName}}!</p>
  //   <p>Le service <b>{{service.name}}</b> auquel vous apparteniez a été <b>supprimé</b>.</p>
  //   {{#wasDemoted}}
  //     <p><b>Conséquence :</b> vous n'êtes plus « agent » car aucun service ne vous est désormais attribué.</p>
  //   {{/wasDemoted}}
  //   <p style="margin:16px 0">
  //     <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
  //       Ouvrir {{app.name}}
  //     </a>
  //   </p>
  //   <p style="font-size:14px;color:#555">Si vous pensez qu'il s'agit d'une erreur, merci de répondre à cet email.</p>
  //   <p>— L’équipe {{app.name}}</p>
  // </div>`.trim(),
  //   },

  /* ===================== ✅ LICENSE EMAILS ===================== */

  "marketplace.license_issued": {
    subject: "Félicitations pour votre achat 🎉 — {{product.title}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Félicitations pour votre achat, {{user.firstName}} 🎉
  </p>

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px;margin:10px 0 16px">
    <div style="margin:0 0 8px"><b>Produit :</b> {{product.title}}</div>
    <div style="margin:0 0 8px"><b>Clé de licence :</b></div>

    <div style="font-size:18px;font-weight:800;letter-spacing:1px;background:#fff;border:1px dashed #cbd5e1;padding:12px 14px;border-radius:12px;display:inline-block">
      {{license.key}}
    </div>

    <div style="margin:12px 0 0"><b>Expire le :</b> {{license.expiresAt}}</div>
  </div>

  <p style="margin:0 0 10px">
    Copiez votre licence et insérez-la lors de l’installation de votre robot.
  </p>

  <p style="margin:0 0 14px">
    Si vous avez du mal, vous pouvez contacter notre support ici :
  </p>

  <p style="margin:0 0 12px">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 WhatsApp – Nous contacter
    </a>
  </p>

  <p style="margin:0">
    <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir {{app.name}}
    </a>
  </p>

  <p style="font-size:13px;color:#555;margin-top:16px">
    Conservez cet email. Si vous pensez que cette demande n’est pas la vôtre, ignorez-le.
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "marketplace.license_renewed": {
    subject: "Renouvellement confirmé 🎉 — {{product.title}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Félicitations, votre licence a été renouvelée, {{user.firstName}} 🎉
  </p>

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px;margin:10px 0 16px">
    <div style="margin:0 0 8px"><b>Produit :</b> {{product.title}}</div>
    <div style="margin:0 0 8px"><b>Clé de licence :</b></div>

    <div style="font-size:18px;font-weight:800;letter-spacing:1px;background:#fff;border:1px dashed #cbd5e1;padding:12px 14px;border-radius:12px;display:inline-block">
      {{license.key}}
    </div>

    <div style="margin:12px 0 0"><b>Expire le :</b> {{license.expiresAt}}</div>
  </div>

  <p style="margin:0 0 10px">
    Copiez votre licence et insérez-la lors de l’installation de votre robot.
  </p>

  <p style="margin:0 0 14px">
    Si vous avez du mal, vous pouvez contacter notre support ici :
  </p>

  <p style="margin:0 0 12px">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 WhatsApp – Nous contacter
    </a>
  </p>

  <p style="margin:0">
    <a href="{{app.url}}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir {{app.name}}
    </a>
  </p>

  <p style="font-size:13px;color:#555;margin-top:16px">
    Si vous pensez qu'il s'agit d'une erreur, répondez à cet email.
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ===================== ✅ MARKETPLACE CRYPTO EMAILS ===================== */

  "marketplace.crypto_approved": {
    subject: "Paiement crypto validé ✅ — {{product.title}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Bonne nouvelle ! Votre paiement crypto pour <b>{{product.title}}</b> a été <b>validé</b>.
  </p>

  <p style="margin:0 0 12px">
    Votre commande est maintenant finalisée.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/marketplace/dashboard?tab=orders&subtab=orders"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Accéder à mes produits
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "marketplace.crypto_rejected": {
    subject: "Paiement crypto refusé ❌ — {{product.title}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Votre paiement crypto pour <b>{{product.title}}</b> n'a pas pu être validé.
  </p>

  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 4px;font-weight:bold;color:#991b1b">Motif du refus :</div>
    <div style="margin:0;color:#7f1d1d">{{reason}}</div>
  </div>

  <p style="margin:0 0 12px">
    Vous pouvez retenter le paiement ou nous contacter si vous pensez qu'il s'agit d'une erreur.
  </p>

  <p style="margin:0">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 Contacter le support
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ===================== ✅ FM-METRIX EMAILS ===================== */

  "fmmetrix.premium_activated": {
    subject: "Félicitations 🎉 votre compte est désormais Premium (FM-Metrix)",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Félicitations {{user.firstName}} 🎉
  </p>

  <p style="margin:0 0 10px">
    Votre compte est désormais <b>Premium</b> sur <b>FM-Metrix</b>.
  </p>

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Accès valable jusqu’au :</b> {{sub.validUntil}}</div>
  </div>

  <p style="margin:0 0 12px">
    Vous pouvez accéder à FM-Metrix dès maintenant.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/a-propos"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir FM-Metrix
    </a>
  </p>

  <p style="font-size:13px;color:#555;margin-top:16px">
    Si vous pensez que cet achat n’est pas le vôtre, ignorez cet email.
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "fmmetrix.subscription_expiring": {
    subject: "Expiration prochaine — FM-Metrix Premium",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Votre abonnement <b>FM-Metrix Premium</b> arrive bientôt à expiration.
  </p>

  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Fin prévue :</b> {{sub.validUntil}}</div>
    <div style="margin:0"><b>Jours restants :</b> {{sub.daysLeft}}</div>
  </div>

  <p style="margin:0 0 12px">
    Renouvelez maintenant pour éviter toute interruption.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/tarifs"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Renouveler / Gérer mon abonnement
    </a>
  </p>

  <p style="margin:14px 0 0">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 Support WhatsApp
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "fmmetrix.subscription_renewed": {
    subject: "Renouvellement de l’abonnement réussi ✅ (FM-Metrix)",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Merci {{user.firstName}} ✅
  </p>

  <p style="margin:0 0 10px">
    Votre renouvellement <b>FM-Metrix Premium</b> a été confirmé.
  </p>

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Nouvelle date de fin :</b> {{sub.validUntil}}</div>
  </div>

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/a-propos"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir FM-Metrix
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "fmmetrix.subscription_expired": {
    subject: "Abonnement expiré — FM-Metrix Premium",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Votre abonnement <b>FM-Metrix Premium</b> est arrivé à expiration.
  </p>

  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Date de fin :</b> {{sub.validUntil}}</div>
  </div>

  <p style="margin:0 0 12px">
    Vous pouvez renouveler pour réactiver l’accès Premium.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/tarifs"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Renouveler
    </a>
  </p>

  <p style="margin:14px 0 0">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 Support WhatsApp
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "fmmetrix.manual_grant": {
    subject: "Accès FM-Metrix accordé ✅ (administration)",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}} ✅
  </p>

  <p style="margin:0 0 10px">
    Un administrateur vous a accordé un accès <b>FM-Metrix Premium</b>.
  </p>

  {{#sub.months}}
    <p style="margin:0 0 10px">
      <b>Durée :</b> {{sub.months}} mois
    </p>
  {{/sub.months}}

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Accès valable jusqu’au :</b> {{sub.validUntil}}</div>
  </div>

  {{#sub.adminEmail}}
    <p style="font-size:13px;color:#555;margin:0 0 12px">
      Action effectuée par : {{sub.adminEmail}}
    </p>
  {{/sub.adminEmail}}

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/a-propos"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir FM-Metrix
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "fmmetrix.subscription_canceled": {
    subject: "Abonnement résilié — FM-Metrix Premium",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Votre abonnement <b>FM-Metrix Premium</b> a été <b>résilié</b>.
  </p>

  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:14px 14px;margin:12px 0 16px">
    <div style="margin:0 0 6px"><b>Date de résiliation :</b> {{sub.endedAt}}</div>
    {{#sub.reason}}
      <div style="margin:8px 0 0"><b>Raison :</b> {{sub.reason}}</div>
    {{/sub.reason}}
  </div>

  <p style="margin:0 0 12px">
    Vous pouvez continuer à utiliser FM-Metrix en mode standard.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/fm-metrix/a-propos"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Ouvrir FM-Metrix
    </a>
  </p>

  <p style="margin-top:10px">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ✅ NOUVEAU : NOTIFICATION VENDEUR */
  "marketplace.sale_notification": {
    subject: "Vous avez réalisé une vente ! 🎉",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Félicitations {{user.firstName}} ! 🚀
  </p>

  <p style="margin:0 0 10px">
    Vous avez reçu une nouvelle commande de la part de <b>{{customer.name}}</b>.
  </p>

  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:12px 0 16px">
    <div style="margin:0 0 8px;font-weight:bold;color:#4b5563;text-transform:uppercase;font-size:12px;letter-spacing:0.5px">Détails de la vente</div>
    <ul style="padding-left:16px;margin:0;list-style-type:circle">
      {{#items}}
        <li style="margin-bottom:6px">
          <b>{{title}}</b> <span style="color:#6b7280">(x{{qty}})</span> — <span style="font-weight:600">{{amount}}</span>
        </li>
      {{/items}}
    </ul>
    
    <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #cbd5e1;font-weight:800;font-size:18px;color:#059669;text-align:right">
      Total : {{totalEarnings}}
    </div>
  </div>

  <p style="margin:0">
    <a href="https://fullmargin.net/marketplace/dashboard?tab=ventes"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Voir mes ventes
    </a>
  </p>

  <p style="margin-top:10px;font-size:14px;color:#6b7280">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "marketplace.order_success": {
    subject: "Confirmation de votre commande ✅ — {{product.title}}",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Merci pour votre commande, {{user.firstName}} !
  </p>

  <p style="margin:0 0 10px">
    Votre achat pour <b>{{product.title}}</b> a bien été confirmé.
  </p>

  <p style="margin:0 0 12px">
    Vous pouvez accéder à vos produits et licences dès maintenant.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/marketplace/dashboard?tab=orders&subtab=orders"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Accéder à mes achats
    </a>
  </p>

  <p style="margin-top:10px">— L'équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ===================== ✅ FINANCE / WITHDRAWAL EMAILS ===================== */

  "finance.withdrawal_approved": {
    subject: "Votre retrait {{withdrawal.reference}} a été approuvé ✅",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonne nouvelle, {{user.firstName}} ! 🎉
  </p>

  <p style="margin:0 0 10px">
    Votre demande de retrait a été <b>approuvée et payée</b>.
  </p>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:16px;margin:12px 0 16px">
    <div style="margin:0 0 8px"><b>Référence :</b> {{withdrawal.reference}}</div>
    <div style="margin:0 0 8px"><b>Montant :</b> <span style="color:#059669;font-weight:800">{{withdrawal.amountNet}}</span></div>
    <div style="margin:0 0 8px"><b>Méthode :</b> {{withdrawal.method}}</div>
  </div>

  {{#withdrawal.hasProof}}
    <p style="margin:0 0 12px">
      <b>Preuve de paiement :</b>
    </p>
    <p style="margin:0 0 16px">
      <a href="{{withdrawal.proofUrl}}" target="_blank" rel="noreferrer"
         style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
        📄 Voir la preuve
      </a>
    </p>
  {{/withdrawal.hasProof}}

  <p style="margin:0 0 12px">
    Le paiement devrait apparaître dans votre compte sous peu, selon la méthode choisie.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/wallet/withdraw"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Voir l'historique des retraits
    </a>
  </p>

  <p style="margin:14px 0 0">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 Support WhatsApp
    </a>
  </p>

  <p style="font-size:13px;color:#555;margin-top:16px">
    Si vous avez des questions concernant ce retrait, n'hésitez pas à nous contacter.
  </p>

  <p style="margin-top:10px">— L'équipe {{app.name}}</p>
</div>`.trim(),
  },

  "finance.withdrawal_rejected": {
    subject: "Votre retrait {{withdrawal.reference}} a été refusé ❌",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Bonjour {{user.firstName}},
  </p>

  <p style="margin:0 0 10px">
    Votre demande de retrait a été <b>refusée</b>.
  </p>

  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px;margin:12px 0 16px">
    <div style="margin:0 0 8px"><b>Référence :</b> {{withdrawal.reference}}</div>
    <div style="margin:0 0 8px"><b>Montant :</b> {{withdrawal.amountNet}}</div>
    <div style="margin:12px 0 4px;font-weight:bold;color:#991b1b">Motif du refus :</div>
    <div style="margin:0;color:#7f1d1d;background:#fff;padding:10px;border-radius:8px;border:1px dashed #fca5a5">
      {{withdrawal.reason}}
    </div>
  </div>

  <p style="margin:0 0 12px">
    Votre solde a été <b>restauré</b> et vous pouvez effectuer une nouvelle demande de retrait.
  </p>

  <p style="margin:0 0 16px">
    Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, n'hésitez pas à nous contacter.
  </p>

  <p style="margin:0">
    <a href="https://fullmargin.net/wallet/withdraw"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Faire une nouvelle demande
    </a>
  </p>

  <p style="margin:14px 0 0">
    <a href="{{support.whatsappUrl}}" target="_blank" rel="noreferrer"
       style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      👉 Contacter le support
    </a>
  </p>

  <p style="margin-top:10px">— L'équipe {{app.name}}</p>
</div>`.trim(),
  },

  /* ✅ NOUVEAU : NOTIFICATION VENDEUR DE COURS (FORMATION) */
  "course.sale_notification": {
    subject: "Nouvelle vente de votre formation ! 🎉",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.55">
  <p style="font-size:18px;font-weight:800;margin:0 0 14px">
    Félicitations {{user.firstName}} ! 🚀
  </p>
  <p style="margin:0 0 10px">
    Vous avez une nouvelle inscription payante.
  </p>
  <div style="background:#f7f7fb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:12px 0 16px">
    <div style="margin:0 0 8px"><b>Formation :</b> {{course.title}}</div>
    <div style="margin:0 0 8px"><b>Montant net gagné :</b> <span style="color:#059669;font-weight:800">{{earnings}}</span></div>
  </div>
  <p style="margin:0">
    <a href="https://fullmargin.net/communaute/mon-espace?tab=ventes"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 16px;border-radius:12px;font-weight:800">
      Voir mes ventes
    </a>
  </p>
  <p style="margin-top:10px;font-size:14px;color:#6b7280">— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  "admin.user_promoted": {
    subject: "Promotion au rang d'administrateur 🛡️",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.6">
  <p style="font-size:18px;">Bonjour <b>{{user.firstName}}</b>,</p>
  <p>Félicitations ! Un administrateur vient de vous accorder des <b>droits d'administration</b> sur la plateforme <b>{{app.name}}</b>.</p>
  
  <div style="background:#f4f4f9; border-radius:14px; padding:20px; margin:20px 0; border:1px solid #e2e8f0;">
    <p style="margin-top:0; font-weight:700; color:#7c3aed;">Accès accordés :</p>
    <ul style="margin:0; padding-left:20px; color:#334155;">
      {{{permissionsString}}}
    </ul>
  </div>

  <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:15px; margin:20px 0; color:#9a3412; font-size:14px;">
    <b>⚠️ Important :</b> Pour que ces nouveaux accès soient activés, merci de vous <b>déconnecter puis de vous reconnecter</b> à votre compte.
  </div>

  <p>Vous pouvez désormais accéder à votre espace de gestion personnalisé via le bouton ci-dessous :</p>
  
  <p style="margin:24px 0 text-align:center;">
    <a href="{{redirectUrl}}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;box-shadow:0 4px 6px rgba(124,58,237,0.2);">
      Accéder au Panel Admin
    </a>
  </p>

  <p style="font-size:14px; color:#64748b;">Note : Si vous ne voyez pas certains menus, c'est que vos accès sont limités aux sections listées ci-dessus.</p>
  <p>— L'équipe {{app.name}}</p>
</div>`.trim(),
  },
  "admin.user_demoted": {
    subject: "Mise à jour de vos accès 🔒",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.6">
  <p style="font-size:18px;">Bonjour <b>{{user.firstName}}</b>,</p>
  <p>Nous vous informons que vos privilèges d'administrateur sur <b>{{app.name}}</b> ont été <b>révoqués</b>.</p>
  
  <div style="background:#fff1f2; border-radius:14px; padding:20px; margin:20px 0; border:1px solid #fecdd3; color:#9f1239;">
    <p style="margin:0 0 10px 0; font-weight:600; font-size:16px;">Votre compte a été rétrogradé au rang de Membre Standard.</p>
    <p style="margin:0; font-size:14px;"><b>⚠️ Important :</b> Merci de vous <b>déconnecter puis de vous reconnecter</b> à votre compte pour mettre à jour votre interface.</p>
  </div>

  <p>Vous conservez néanmoins l'accès normal à vos services personnels, vos communautés et votre portefeuille.</p>
  
  <p style="margin-top:24px; font-size:14px; color:#64748b;">Si vous pensez qu'il s'agit d'une erreur, veuillez contacter la direction.</p>
  <p>— L'équipe {{app.name}}</p>
</div>`.trim(),
  },

  "community.post_deleted_by_admin": {
    subject: "Votre publication a été retirée 📢",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.6">
  <p>Bonjour <b>{{user.firstName}}</b>,</p>
  <p>Nous vous informons qu'un administrateur a retiré l'une de vos publications dans la communauté <b>{{community.name}}</b>.</p>
  
  <div style="background:#fef2f2; border-radius:14px; padding:20px; margin:20px 0; border:1px solid #fecdd3; color:#9f1239;">
    <p style="margin:0 0 10px 0; font-weight:600; font-size:16px;">Motif du retrait :</p>
    <p style="margin:0; font-size:14px;">{{reason}}</p>
  </div>

  <p>Nous vous rappelons que toutes les publications doivent respecter les conditions d'utilisation et la charte de la communauté.</p>
  <p>— L'équipe {{app.name}}</p>
</div>`.trim(),
  },
};

module.exports = { DEFAULTS };
