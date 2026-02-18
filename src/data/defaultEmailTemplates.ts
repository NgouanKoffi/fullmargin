// C:\Users\ADMIN\Desktop\fullmargin-site\src\data\defaultEmailTemplates.ts

export type EmailTemplate = {
  /** Identifiant stable (slug) */
  id: string;
  /** Intitulé lisible */
  name: string;
  /** Brève description de l’usage */
  description: string;
  /** Sujet par défaut (avec variables éventuelles) */
  subject: string;
  /** HTML par défaut (avec variables éventuelles) */
  html: string;
};

/**
 * Modèles d’e-mail par défaut — alignés sur utils/mailer.js :
 * - sendLoginCode
 * - sendWelcomeEmail
 * - sendPasswordResetCode
 * - sendLicenseIssuedEmail
 * - sendLicenseRenewedEmail
 *
 * Conventions de variables :
 * {{app.name}}  : nom de l’application
 * {{app.url}}   : URL de l’app
 * {{user.firstName}}, {{user.fullName}}, {{user.email}}
 * {{code}}, {{minutes}}
 *
 * Templates licence :
 * {{product.title}}
 * {{license.key}}, {{license.expiresAt}}
 * {{support.whatsappUrl}}
 */
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "auth.login_code",
    name: "Code de connexion (2FA)",
    description:
      "Envoi d’un code à usage unique après saisie du mot de passe (connexion locale avec 2FA).",
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

  {
    id: "auth.welcome",
    name: "Bienvenue",
    description:
      "Envoyé à la création d’un compte (inscription via Google ou locale).",
    subject: "Bienvenue sur {{app.name}} 🚀",
    html: `
<div style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#111;line-height:1.5">
  <p>Bonjour {{user.firstName}},</p>
  <p>Ton compte <b>{{app.name}}</b> est prêt 🎉</p>
  <p>Tu peux dès maintenant te connecter et découvrir l'application.</p>

  <p style="margin:16px 0">
    <a href="{{app.url}}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
      Ouvrir {{app.name}}
    </a>
  </p>

  <p style="font-size:14px;color:#555">
    Si tu n’es pas à l’origine de cette inscription, ignore simplement cet email.
  </p>
  <p>— L’équipe {{app.name}}</p>
</div>`.trim(),
  },

  {
    id: "auth.password_reset_code",
    name: "Réinitialisation du mot de passe",
    description:
      "Envoi du code de réinitialisation suite à une demande de reset.",
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

  /* ===================== ✅ LICENSE EMAILS ===================== */

  {
    id: "marketplace.license_issued",
    name: "Licence délivrée (achat)",
    description:
      "Envoyé après l’achat d’un produit sous licence. Contient la clé et la date d’expiration + support WhatsApp.",
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

  {
    id: "marketplace.license_renewed",
    name: "Licence renouvelée",
    description:
      "Envoyé après le renouvellement d’une licence. Contient la clé et la nouvelle expiration + support WhatsApp.",
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
];

export default DEFAULT_EMAIL_TEMPLATES;
