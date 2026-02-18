// src/pages/podcasts/data.ts
import type { ElementType } from "react";
import {
  ListMusic,
  Zap,
  AlarmClock,
  Target,
  CheckCircle,
  Briefcase,
  Cpu,
  HeartPulse,
  Smile,
  Coffee,
} from "lucide-react";
import type { SidebarItem } from "./types";

export const PRIMARY: SidebarItem[] = [{ label: "Playlist", icon: ListMusic }];

/**
 * Catégories : libellés mis à jour pour correspondre
 * aux intitulés rouges de la maquette.
 * On garde les icônes correspondantes de la colonne de gauche.
 */
export const CATEGORIES: SidebarItem[] = [
  { label: "Trading", icon: Zap },
  { label: "Culture education", icon: AlarmClock },
  { label: "Meditation", icon: Target },
  { label: "Inspiration", icon: CheckCircle },
  { label: "Mix Rap", icon: Briefcase },
  { label: "Mix Lofi", icon: Cpu },
  { label: "Mix Afro beat", icon: HeartPulse },
  { label: "Mix Latino", icon: Smile },
  { label: "Mix Edm", icon: Coffee },
];

// Texte d’intro par onglet (facultatif)
export const CATEGORY_META: Record<
  string,
  { desc: string; icon?: ElementType }
> = {
  Playlist: {
    desc: "Vos sélections favorites, prêtes à rejouer.",
    icon: ListMusic,
  },
  Trading: { desc: "Énergie pour passer à l’action." },
  "Culture education": { desc: "Éveille l’esprit et ouvre les horizons." },
  Meditation: { desc: "Ambiances calmes pour respirer et se centrer." },
  Inspiration: { desc: "Idées fraîches et motivation douce." },
  "Mix Rap": { desc: "Sélection rythmée pour booster le flow." },
  "Mix Lofi": { desc: "Beats lofi pour travailler en douceur." },
  "Mix Afro beat": { desc: "Vibes afro pour le bon mood." },
  "Mix Latino": { desc: "Soleil et tempo latin, ça bouge." },
  "Mix Edm": { desc: "Électro pour garder le rythme." },
};
