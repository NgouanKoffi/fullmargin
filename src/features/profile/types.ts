import type { CountryCode } from "libphonenumber-js";

/** Identifiants d’onglets disponibles sur la page Profil (cohérents avec About/Friends/Security) */
export type TabId = "about" | "friends" | "security" | "affiliation";

/** Données éditables du profil côté UI (état local de AboutTab) */
export type ProfileExtra = {
  coverUrl?: string;
  avatarUrl?: string;
  fullName?: string;
  phone?: string; // E.164 stocké côté API (ex: +22501020304)
  bio?: string;
  country?: CountryCode; // ISO-3166 alpha-2 (CI, FR…) pour les Selects du front
  city?: string;
};

/* =================================================================================
 *                               === API DTOs ===
 * =================================================================================
 * On distingue les formes "DTO" (retour/entrée API) de l'état UI.
 * - country: string ISO2 uppercase côté API (ex: "CI"), converti en CountryCode côté UI.
 */

export type ProfileExtraDTO = {
  fullName?: string;
  email?: string; // présent au GET, non édité par PATCH
  phone?: string; // E.164
  country?: string; // ISO2 uppercase ("CI")
  city?: string;
  bio?: string;
};

export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error?: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type GetProfileExtraResponse = ApiOk<{ profile: ProfileExtraDTO }>;
export type PatchProfileExtraResponse = ApiOk<{ profile: ProfileExtraDTO }>;

/* =================================================================================
 *                        === /auth/me (sécurité / flags) ===
 * ================================================================================= */

export type SecurityFlags = {
  /** true si le compte est lié à Google (googleId présent) */
  isGoogleLinked?: boolean | null;
  /** true si la connexion par mot de passe est autorisée pour ce compte */
  localEnabled?: boolean | null;
  /** true si la 2FA est activée */
  twoFAEnabled?: boolean | null;
};

/** Version normalisée des flags côté UI (utilisable directement dans SecurityTab) */
export type ResolvedSecurityFlags = {
  isGoogleLinked: boolean;
  localEnabled: boolean;
  twoFAEnabled: boolean;
};

/** User minimal renvoyé par /auth/me */
export type MeUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  security?: SecurityFlags;
};

export type MeResponse = ApiOk<{ user: MeUser }>;

/* =================================================================================
 *                               === Friends ===
 * ================================================================================= */

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  mutual: number;
  online: boolean;
  location?: string;
};

/* =================================================================================
 *                             === Affiliation ===
 * =================================================================================
 * - code: code unique de parrainage (ex: "AB12CD34")
 * - link: lien partageable (ex: https://site.fullmargin.net/auth?tab=signup&ref=AB12CD34)
 * - affiliates: liste des utilisateurs inscrits via ce code
 * - commissions: liste des commissions générées par les paiements FM Metrix des filleuls
 * - totals: agrégat par devise, en CENTIMES (ex: { usd: 435 } = 4,35 USD)
 */

export type Affiliate = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinedAt?: string; // ISO string
};

/**
 * Commission générée par le paiement d’un filleul.
 * monthIndex = 1 → premier mois (15%)
 * monthIndex = 2 → deuxième mois (9%)
 */
export type AffiliationCommission = {
  /** id interne de la commission côté API */
  id: string;
  /** id du filleul qui a payé */
  userId: string;
  /** id de la souscription/source (ex: FmMetrixSubscription) */
  subscriptionId: string;
  /** 1 = premier mois, 2 = deuxième mois */
  monthIndex: 1 | 2;
  /** taux appliqué (0.15 ou 0.09) */
  rate: number;
  /** montant en CENTIMES issu du paiement de 29$ (donc 15% = 435 cents) */
  amount: number;
  /** devise, on reste sur ce que Stripe a renvoyé (usd en test) */
  currency: string;
  /** pour tracer d’où ça vient (ex: "fm-metrix") */
  source?: string;
  /** date de création de la commission */
  createdAt?: string;
};

export type AffiliationMe = {
  code: string | null;
  link: string | null;
  affiliates: Affiliate[];
  count: number;
  /**
   * commissions détaillées, renvoyées par le backend
   * on peut les regrouper côté front par monthIndex
   */
  commissions?: AffiliationCommission[];
  /**
   * totaux par devise, en CENTIMES
   * ex: { usd: 870 } → 8,70 USD
   */
  totals?: Record<string, number>;
};

export type GetAffiliationMeResponse = ApiOk<{ data: AffiliationMe }>;
export type GenerateAffiliationResponse = ApiOk<{ data: AffiliationMe }>;
