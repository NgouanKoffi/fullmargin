// src/pages/notifications/constants.ts
import {
  Bell,
  Users,
  ShoppingBag,
  Wallet,
  Sparkles,
  Zap,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export type NotificationCategory =
  | "all"
  | "community"
  | "marketplace"
  | "courses"
  | "fmmetrix"
  | "finance"
  | "admin"
  | "roles";

export type Notification = {
  id: string;
  kind: string;
  communityId?: string | null;
  payload?: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
};

export const CATEGORY_CONFIG = {
  all: {
    label: "Toutes",
    icon: Bell,
    color: "from-slate-600 to-slate-700",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    border: "border-slate-200 dark:border-slate-700",
    badge: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  },
  community: {
    label: "Communauté",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/50",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  courses: {
    label: "Formations",
    icon: GraduationCap,
    color: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50/60 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/50",
    badge:
      "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  },
  marketplace: {
    label: "Marketplace",
    icon: ShoppingBag,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  },
  fmmetrix: {
    label: "FM Metrix",
    icon: Zap,
    color: "from-fuchsia-500 to-pink-600",
    bg: "bg-fuchsia-50/60 dark:bg-fuchsia-950/20",
    border: "border-fuchsia-200 dark:border-fuchsia-800/50",
    badge:
      "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300",
  },
  finance: {
    label: "Finance",
    icon: Wallet,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/50",
    badge:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  },
  roles: {
    label: "Rôles",
    icon: ShieldCheck,
    color: "from-indigo-600 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-100 dark:border-indigo-800",
    badge:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300",
  },
  admin: {
    label: "Admin",
    icon: Sparkles,
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50/60 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800/50",
    badge:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  },
};

// Ajout des notifications de rôles ici pour désactiver le clic/redirection
export const NON_CLICKABLE_TYPES = [
  "community_member_left",
  "community_member_joined",
  "admin_role_granted",
  "admin_role_revoked",
  "community_deleted",
  "community_restored",
  "warning_issued",
  "community_deleted_due_to_warnings",
];
