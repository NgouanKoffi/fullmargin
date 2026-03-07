// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\types.ts
/* =============================
 *  Communautés — Types globaux
 * ============================= */

/**
 * Catégories GLOBALLES (6 max) définies par le client.
 *
 * On garde ici des clés techniques stables (snake_case),
 * et on mappe les labels UI dans COMMUNITY_TRADING_CATEGORIES.
 *
 * 1. trading_markets        → Trading & Marchés financiers
 * 2. education_formations   → Éducation & Formations
 * 3. outils_ressources      → Outils, Indicateurs & Ressources
 * 4. mindset_psychologie    → Mindset & Psychologie
 * 5. business_finances      → Business & Finances personnelles
 * 6. communautes_coaching   → Communautés & Coaching
 */
export type CommunityTradingCategory =
  | "trading_markets"
  | "education_formations"
  | "outils_ressources"
  | "mindset_psychologie"
  | "business_finances"
  | "communautes_coaching";

/** Statut de visibilité */
export type CommunityVisibility = "public" | "private";

/** Payload UI → API pour créer/mettre à jour une communauté */
export type CommunityCreatePayload = {
  /** Nom affiché (ex: FULLMARGIN TRADERS) */
  name: string;
  /** Identifiant URL (ex: fullmargin-traders) */
  slug: string;
  /** Catégorie (parmi les 6) */
  category: CommunityTradingCategory | string;
  /** Si un jour tu veux un champ texte spécifique (facultatif côté API) */
  categoryOther?: string;
  /** Description publique */
  description: string;
  /** Statut : public / private */
  visibility: CommunityVisibility;
};

/** Fichiers envoyés à l’API au moment de la création */
export type CommunityCreateFiles = {
  /** Image de couverture (bannière) */
  cover?: File | null;
  /** Logo (avatar rond) */
  logo?: File | null;
};

/** Réponse standard de création (adapter selon ton backend) */
export type CommunityCreateResponse =
  | {
      ok: true;
      id: string;
      slug: string;
      message?: string;
    }
  | {
      ok: false;
      code: string; // ex: "slug_conflict" | "validation_error"
      message: string; // message lisible UI
      issues?: string[]; // détails de validation si besoin
    };

/** Petite forme publique pour futur affichage (si tu veux réutiliser) */
export type CommunityPublic = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  visibility: CommunityVisibility;
  coverUrl?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

/* =============================
 *  Demandes d’adhésion (privé)
 * ============================= */

/** Statut d’une demande d’accès à une communauté privée */
export type MembershipRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled";

/** Demande d’adhésion (forme légère côté front) */
export type MembershipRequest = {
  id: string;
  communityId: string;
  userId: string;
  message?: string;
  status: MembershipRequestStatus;
  createdAt: string;
  decidedAt?: string;
};

/** Labels UI pour les statuts (si besoin côté rendu) */
export function membershipStatusLabel(s: MembershipRequestStatus): string {
  switch (s) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Refusée";
    case "canceled":
      return "Annulée";
  }
}

/* =============================
 *  Onglets & libellés
 * ============================= */

export type TabKey =
  | "apercu"
  | "publications"
  | "formations"
  | "groupes"
  | "direct"
  | "avis"
  | "demandes"
  | "notifications"
  | "paramètres"
  | "ventes"
  | "achats";

export function tabLabel(k: TabKey): string {
  switch (k) {
    case "apercu":
      return "Aperçu";
    case "publications":
      return "Publications";
    case "formations":
      return "Formations";
    case "groupes":
      return "Groupes";
    case "direct":
      return "Direct";
    case "avis":
      return "Avis";
    case "paramètres":
      return "Paramètres";
    case "ventes":
      return "Ventes";
    case "achats":
      return "Achats";
    case "demandes":
      return "Abonnements";
    case "notifications":
      return "Notifications";
    default:
      return "Onglet";
  }
}

/* =============================
 *  Aides UI (facultatif)
 * ============================= */

/**
 * Liste des 6 catégories affichées dans le select.
 * Si le client change les intitulés, tu touches JUSTE ici.
 */
export const COMMUNITY_TRADING_CATEGORIES: ReadonlyArray<{
  value: CommunityTradingCategory;
  label: string;
  group: string;
}> = [
  {
    value: "trading_markets",
    label: "Trading & Marchés financiers",
    group: "Trading & Marchés",
  },
  {
    value: "education_formations",
    label: "Éducation & Formations",
    group: "Contenus & pédagogie",
  },
  {
    value: "outils_ressources",
    label: "Outils, indicateurs & ressources",
    group: "Outils & ressources",
  },
  {
    value: "mindset_psychologie",
    label: "Mindset & Psychologie",
    group: "Mindset & psychologie",
  },
  {
    value: "business_finances",
    label: "Business & Finances personnelles",
    group: "Business & finances",
  },
  {
    value: "communautes_coaching",
    label: "Communautés & Coaching",
    group: "Communautés",
  },
] as const;

/** Erreur API simple pour centraliser les toasts */
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};
