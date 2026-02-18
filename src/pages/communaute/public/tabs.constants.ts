// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\tabs.constants.ts
import { createElement, type ReactNode } from "react";
import { Users, MessageSquareText, Radio, Layers } from "lucide-react";

export type TabKey =
  | "communautes"
  | "groupes"
  | "feed"
  | "formations"
  | "direct";

export type TabDef = { key: TabKey; label: string; icon: ReactNode };

export const TABS: TabDef[] = [
  {
    key: "communautes",
    label: "Communautés",
    icon: createElement(Users, { className: "w-4 h-4" }),
  },
  {
    key: "groupes",
    label: "Groupes",
    icon: createElement(Users, { className: "w-4 h-4" }), // ✅ même icône pour l’instant
  },
  {
    key: "feed",
    label: "Fil d’actualité",
    icon: createElement(MessageSquareText, { className: "w-4 h-4" }),
  },
  {
    key: "formations",
    label: "Formations",
    icon: createElement(Layers, { className: "w-4 h-4" }),
  },
  {
    key: "direct",
    label: "Direct",
    icon: createElement(Radio, { className: "w-4 h-4" }),
  },
];
