// src/pages/admin/services/BrevoEmails/brevoEmails.ts

export type EmailAccount = {
  id: string;
  label: string;
  email: string;
  password?: string;     // optionnel (DEV via Vite); ne jamais hardcoder en prod
  verified?: boolean;
};

// ⚠️ Source unique de vérité pour les expéditeurs Brevo (front)
export const BREVO_EMAILS: EmailAccount[] = [
  {
    id: "podcast",
    label: "Service podcast FullMargin",
    email: "podcast@fullmargin.net",
    password: import.meta.env.VITE_BREVO_SMTP_PWD_PODCAST || "",
    verified: true,
  },
];

// Petites aides pratiques côté UI
export const listSenderOptions = () =>
  BREVO_EMAILS.map(({ id, label, email }) => ({ id, label, email }));

export const findEmailByAddress = (addr: string) =>
  BREVO_EMAILS.find((e) => e.email === addr);
