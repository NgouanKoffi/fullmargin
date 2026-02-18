// src/pages/communaute/public/community-details/utils/mapping.ts
import type { ComplaintBE, ComplaintReason } from "../api/complaints.api";

/* ================= Reviews ================= */

export type ReviewUI = {
  id: string;
  communityId: string;
  user: { id: string; name?: string; avatarUrl?: string };
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  createdAt: string;
  updatedAt?: string;
};

export function mapReviewBEtoUI(
  be: {
    id: string;
    user: string | { id: string; fullName?: string; avatarUrl?: string };
    rating: number;
    message?: string;
    comment?: string;
    body?: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
  },
  communityId: string
): ReviewUI {
  const createdAt =
    typeof be.createdAt === "string"
      ? be.createdAt
      : new Date(be.createdAt).toISOString();
  const updatedAt =
    be.updatedAt == null
      ? undefined
      : typeof be.updatedAt === "string"
      ? be.updatedAt
      : new Date(be.updatedAt).toISOString();

  const message =
    typeof be.message === "string"
      ? be.message
      : typeof be.comment === "string"
      ? be.comment
      : typeof be.body === "string"
      ? be.body
      : "";

  const user =
    typeof be.user === "string"
      ? { id: be.user, name: "Utilisateur" }
      : {
          id: be.user.id,
          name: be.user.fullName,
          avatarUrl: be.user.avatarUrl,
        };

  return {
    id: be.id,
    communityId,
    user,
    rating: Math.max(1, Math.min(5, Math.round(be.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5,
    message,
    createdAt,
    updatedAt,
  };
}

export function averageRating(items: ReviewUI[]): number | null {
  if (!items.length) return null;
  const S = items.reduce((a, b) => a + b.rating, 0);
  return Math.round((S / items.length) * 10) / 10;
}

/* ================= Reports ================= */

/** On aligne le type UI sur le BE et on garde `pending` pour éviter les TS2322 */
export type ReportReason = ComplaintReason;

export type ReportDraft = {
  reason: ReportReason;
  message: string;
  images?: string[];
  subject?: { type: "post" | "comment" | "user" | "other"; id?: string };
};

export type ReportUI = {
  id: string;
  communityId: string;
  user: { id: string; name?: string; avatarUrl?: string };
  reason: ReportReason;
  message: string;
  images?: string[];
  status?: "open" | "in_review" | "resolved" | "rejected" | "pending";
  subject?: { type: "post" | "comment" | "user" | "other"; id?: string };
  createdAt: string;
  updatedAt?: string;
};

const validComplaintReasons: ReadonlySet<string> = new Set([
  "spam",
  "inappropriate",
  "harassment",
  "counterfeit",
  "other",
]);

function asComplaintReason(reason: string): ComplaintReason {
  return validComplaintReasons.has(reason)
    ? (reason as ComplaintReason)
    : "other";
}

/** libellés FR utilisés par la liste / l’éditeur */
const reasonLabelMap: Record<ReportReason, string> = {
  inappropriate: "Contenu inapproprié",
  harassment: "Harcèlement",
  spam: "Spam",
  counterfeit: "Contrefaçon",
  other: "Autre",
};

/** Utilitaire exporté (certaines vues l'importent) */
export function reasonToLabel(r: ReportReason): string {
  return reasonLabelMap[r] ?? "Autre";
}

/** BE → UI */
export function mapComplaintBEtoUI(be: ComplaintBE): ReportUI {
  const createdAt =
    typeof be.createdAt === "string"
      ? be.createdAt
      : new Date(be.createdAt).toISOString();
  const updatedAt =
    be.updatedAt == null
      ? undefined
      : typeof be.updatedAt === "string"
      ? be.updatedAt
      : new Date(be.updatedAt).toISOString();

  return {
    id: be.id,
    communityId: be.communityId ?? "",
    // le BE renvoie userId (et, côté owner/incoming, on a un populate dans le backend,
    // mais notre type ComplaintBE ne porte pas l'objet user → on mappe minimal)
    user: {
      id: be.userId ?? "unknown_user",
      name: undefined,
      avatarUrl: undefined,
    },
    reason: asComplaintReason(String(be.reason ?? "other")),
    message: be.message ?? be.details ?? be.body ?? "",
    images: be.images,
    status: be.status, // peut être 'pending' également
    subject: be.subject ?? undefined,
    createdAt,
    updatedAt,
  };
}

/** UI → BE (aujourd’hui identique) */
export function uiReasonToBE(r: ReportReason): ComplaintReason {
  return r;
}
