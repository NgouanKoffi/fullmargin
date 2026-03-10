"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook de redirection simplifié pour le développement Frontend.
 * Les appels API et la logique DB sont masqués comme demandé.
 */
export function useFullMetrixRedirect() {
  const router = useRouter();
  const [redirectingFM, setRedirectingFM] = useState(false);

  const goToFM = useCallback(async () => {
    if (redirectingFM) return;

    console.log("[Frontend Only] Simulation de redirection vers Full Metrix platform...");
    setRedirectingFM(true);

    // Simulation d'un délai réseau pour voir l'état de chargement sur les boutons
    setTimeout(() => {
      setRedirectingFM(false);
      // Simuler une redirection ou afficher un message
      alert("Redirection simulée (Mode Frontend Uniquement)");
      // Note: On pourrait utiliser router.push("/fm-metrix-dashboard") si la route existe
    }, 1500);

  }, [redirectingFM]);

  return { goToFM, isLoading: redirectingFM };
}

