// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\hooks\useNameCheck.ts
import { useEffect, useState } from "react";
import { checkNameAvailable } from "../services/community.service";

/**
 * Vérifie l’unicité d’un nom de communauté (debounced).
 * - ok === true  -> disponible
 * - ok === false -> déjà pris
 * - ok === null  -> indéterminé (champ trop court / erreur réseau)
 */
export function useNameCheck(name: string, originalName?: string) {
  const [checking, setChecking] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const v = name.trim();
    if (v.length < 3) {
      setOk(null);
      return;
    }

    const t = window.setTimeout(async () => {
      // En édition: si inchangé → ok
      if (
        originalName &&
        v.toLowerCase() === originalName.trim().toLowerCase()
      ) {
        setOk(true);
        return;
      }
      setChecking(true);
      try {
        const available = await checkNameAvailable(v);
        setOk(available);
      } catch {
        setOk(null);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [name, originalName]);

  return { checking, ok };
}
