// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\rules.ts
import type { ProductType } from "./types";

export const requiresVerification: Record<ProductType, boolean> = {
  robot_trading: true, // ✅ Oui
  indicator: true, // ✅ Oui
  ebook_pdf: false, // Immédiate
  template_excel: false, // Immédiate
};

export const publicationDelay: Record<ProductType, "admin" | "immediate"> = {
  robot_trading: "admin", // Après validation admin
  indicator: "admin", // Après validation admin
  ebook_pdf: "immediate",
  template_excel: "immediate",
};

export const badgeEligible: Record<ProductType, boolean> = {
  robot_trading: true, // ✅ Oui
  indicator: true, // ✅ Oui
  ebook_pdf: true, // ✅ Oui (optionnel)
  template_excel: true, // ✅ Oui (optionnel)
};

export const productTypeOptions: { value: ProductType; label: string }[] = [
  { value: "robot_trading", label: "Robot de trading" },
  { value: "indicator", label: "Indicateur" },
  { value: "ebook_pdf", label: "E-book / PDF / Livre" },
  { value: "template_excel", label: "Template / Outil Excel" },
];
