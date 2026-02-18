// src/pages/communaute/private/community-details/tabs/CommunityProfil/about/AboutTab.tsx
import { useMemo } from "react";
import { useCommunityDraft } from "../../hooks/useCommunityDraft";

// nos deux vues séparées
import AboutTabAdmin from "./AboutTabAdmin";
import AboutTabPublic from "./AboutTabPublic";

export type AboutTabProps = {
  /**
   * force le mode :
   * - "admin"  => formulaire + upload
   * - "public" => vue publique de la communauté
   *
   * si non fourni, on déduit en fonction de l’URL
   */
  viewMode?: "admin" | "public";
  onJoin?: () => void;
};

export default function AboutTab({ viewMode, onJoin }: AboutTabProps) {
  // on garde juste loading + draft, pas besoin de save ici
  const { loading, draft } = useCommunityDraft();

  /**
   * 🧠 Déduction automatique du mode
   * -------------------------------------------------
   * - sur les pages privées (dashboard) → on garde l’admin
   * - sur les pages publiques (/communaute/:slug) → on montre la vue publique
   *
   * Ça enlève le "flash" du formulaire quand on vient depuis "Mes abonnements".
   */
  const inferredMode: "admin" | "public" = useMemo(() => {
    if (viewMode) return viewMode;

    if (typeof window !== "undefined") {
      const path = window.location.pathname;

      // tous tes écrans privés semblent être du style :
      // /communaute/mon-espace ... => là on veut bien l’admin
      if (path.startsWith("/communaute/mon-espace")) {
        return "admin";
      }

      // si on est sur /communaute/:slug (détail public)
      // on veut la vue publique
      if (path.startsWith("/communaute/")) {
        return "public";
      }
    }

    // fallback précédent
    return "admin";
  }, [viewMode]);

  // ce qu’on va passer à la vue publique
  const communityForPublic = useMemo(
    () =>
      draft
        ? {
            name: draft.name,
            slug: draft.slug,
            description: draft.description,
            coverUrl: draft.coverUrl,
            logoUrl: draft.logoUrl,
            category: draft.category,
            visibility: draft.visibility,
          }
        : null,
    [draft]
  );

  if (inferredMode === "admin") {
    return <AboutTabAdmin />;
  }

  // === vue publique ===
  return (
    <AboutTabPublic
      loading={loading}
      error={null}
      community={communityForPublic}
      isMember={false}
      isOwner={false}
      onJoin={onJoin}
    />
  );
}
