import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

type Props = {
  /** Appelé après déconnexion réussie (fermer un panel, rediriger, etc.) */
  onDone?: () => void;
  /** Texte du bouton (défaut: "Se déconnecter") */
  label?: string;
  /** Classes additionnelles */
  className?: string;
  /** Largeur pleine */
  full?: boolean;
};

/**
 * Bouton de déconnexion réutilisable.
 * Style “danger” doux, avec état de chargement.
 */
export default function SignOutButton({
  onDone,
  label = "Se déconnecter",
  className = "",
  full = true,
}: Props) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const base =
    "rounded-2xl px-4 py-3 text-sm font-medium ring-1 transition-colors " +
    "bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-300 ring-red-500/20";
  const width = full ? "w-full" : "";
  const disabled = loading ? "opacity-70 pointer-events-none" : "";

  return (
    <button
      type="button"
      aria-label="Se déconnecter"
      onClick={async () => {
        try {
          setLoading(true);
          await signOut();
          onDone?.();
        } finally {
          setLoading(false);
        }
      }}
      className={`${base} ${width} ${disabled} ${className}`}
    >
      {loading ? "Déconnexion…" : label}
    </button>
  );
}