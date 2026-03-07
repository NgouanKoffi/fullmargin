/** domaines gratuits explicitement autorisés */
export const ALLOWED_FREE = new RegExp(
  "^(gmail\\.com|yahoo\\.[a-z.]+|hotmail\\.[a-z.]+|outlook\\.[a-z.]+|live\\.[a-z.]+)$",
  "i"
);

/** autres fournisseurs gratuits qu’on bloque (ajuste la liste si besoin) */
export const BLOCKED_FREE = new RegExp(
  "(proton\\.me|protonmail\\.com|icloud\\.com|gmx\\.[a-z.]+|aol\\.[a-z.]+|zoho\\.[a-z.]+|yandex\\.[a-z.]+|tutanota\\.com|fastmail\\.com|mail\\.com)$",
  "i"
);

/** motifs d’emails jetables fréquents */
export const DISPOSABLE_PATTERNS = [
  /10minutemail/i,
  /guerrillamail/i,
  /mailinator/i,
  /yopmail/i,
  /tempmail/i,
  /trashmail/i,
  /getnada/i,
  /moakt/i,
  /mohmal/i,
  /sharklasers/i,
  /dropmail/i,
  /emailondeck/i,
  /maildrop/i,
  /minuteinbox/i,
  /linshiemail/i,
  /inboxkitten/i,
];

export function validateEmailStrict(email: string): {
  valid: boolean;
  reason: string | null;
} {
  const e = email.trim().toLowerCase();
  const m = e.match(/^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/);
  if (!m) return { valid: false, reason: "Format d’email invalide." };

  const domain = m[1];

  if (DISPOSABLE_PATTERNS.some((rx) => rx.test(domain))) {
    return { valid: false, reason: "Adresse jetable non autorisée." };
  }

  if (ALLOWED_FREE.test(domain)) {
    return { valid: true, reason: null };
  }

  if (BLOCKED_FREE.test(domain)) {
    return {
      valid: false,
      reason:
        "Utilise gmail, hotmail/outlook, yahoo ou une adresse professionnelle (ex. nom@tondomaine.com).",
    };
  }

  // Domaine non listé → on considère pro (autorisé)
  return { valid: true, reason: null };
}
