// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\index\constants.ts
import type { TabKey } from "../community-details/types.js";

// ✅ Tous les onglets possibles
export const ALLOWED_TABS: TabKey[] = [
  "apercu",
  "publications",
  "formations",
  "groupes",
  "direct",
  "avis",
  "demandes",
  "notifications",
  "paramètres",
  "ventes",
  "achats",
];

// ✅ Onglets BLOQUÉS quand le owner n’a pas encore de communauté
// ❗ On NE bloque PAS "demandes", "notifications" NI "achats"
export const LOCKED_WHEN_NO_COMMUNITY: TabKey[] = [
  "publications",
  "formations",
  "groupes",
  "direct",
  "avis",
  "paramètres",
  "ventes",
  // "achats" retiré pour que Mes achats reste accessible
];

export function isTabKey(x: string | null): x is TabKey {
  return !!x && ALLOWED_TABS.includes(x as TabKey);
}
