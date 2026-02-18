// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\components\communaute\CategoryOptions.ts

import type { CommunityTradingCategory } from "../../types";

export type CategoryItem = { value: CommunityTradingCategory; label: string };
export type CategoryGroup = { label: string; items: CategoryItem[] };

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Trading & Marchés",
    items: [
      {
        value: "trading_markets",
        label: "Trading & Marchés financiers",
      },
    ],
  },
  {
    label: "Contenus & pédagogie",
    items: [
      {
        value: "education_formations",
        label: "Éducation & Formations",
      },
    ],
  },
  {
    label: "Outils & ressources",
    items: [
      {
        value: "outils_ressources",
        label: "Outils, indicateurs & ressources",
      },
    ],
  },
  {
    label: "Mindset & psychologie",
    items: [
      {
        value: "mindset_psychologie",
        label: "Mindset & Psychologie",
      },
    ],
  },
  {
    label: "Business & finances",
    items: [
      {
        value: "business_finances",
        label: "Business & Finances personnelles",
      },
    ],
  },
  {
    label: "Communautés",
    items: [
      {
        value: "communautes_coaching",
        label: "Communautés & Coaching",
      },
    ],
  },
];
