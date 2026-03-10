// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\validation.ts
import type { Product } from "./types";

export type FormError = Partial<Record<keyof Product, string>>;

export function validateProduct(p: Product): FormError {
  const e: FormError = {};
  if (!p.title?.trim()) e.title = "Titre requis.";
  if (!p.shortDescription?.trim())
    e.shortDescription = "Description courte requise.";
  if (!p.longDescription?.trim())
    e.longDescription = "Description longue requise.";
  if (!p.termsAccepted)
    e.termsAccepted = "Vous devez accepter les conditions d’utilisation.";
  if (!p.pricing) e.pricing = "Prix requis.";
  if (p.pricing?.amount !== undefined && p.pricing.amount < 0)
    e.pricing = "Montant invalide.";
  // image/fichier non obligatoires (peuvent être ajoutés après)
  return e;
}
