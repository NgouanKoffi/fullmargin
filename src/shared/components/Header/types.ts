// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\types.ts
export type LinkItem = { label: string; href?: string; desc?: string };

export type SimpleKey =
  | "accueil"
  | "communautes"
  | "tarifs"
  | "boutiques"
  | "apropos"
  | "faq"; // ✅ on ajoute la FAQ

/**
 * Un groupe de navigation peut être :
 * - un group "marketplace" (ancien format, avec items obligatoires)
 * - un lien simple (href) AVEC optionnellement un sous-menu items
 */
export type Group =
  | { key: "marketplace"; label: string; items: LinkItem[] }
  | { key: SimpleKey; label: string; href: string; items?: LinkItem[] };
