// src/pages/communaute/private/community-details/api/groups.api.ts
import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

export type GroupAccessType = "free" | "course";
// Optionnel : tu peux aussi en faire un type à part si tu veux
export type GroupVisibility = "public" | "private";

export type GroupLite = {
  id: string;
  communityId: string;
  ownerId: string;
  name: string;
  accessType: GroupAccessType;
  courseId: string | null;
  coverUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // ✅ Nouveau : description optionnelle
  description?: string | null;
  // ✅ Optionnel : stats qu’on peut brancher plus tard
  membersCount?: number;
  courseTitle?: string | null;
  // ✅ Nouveau : visibilité du groupe (public / private)
  visibility?: GroupVisibility;
};

type GroupsListResponse = {
  ok: boolean;
  data?: { items: GroupLite[] };
  error?: string;
};

export type GroupCreatePayload = {
  name: string;
  accessType: GroupAccessType;
  courseId: string | null;
  coverFile?: File | null;
  description?: string | null;
  // ✅ on peut envoyer la visibilité à la création
  visibility?: GroupVisibility;
};

export type GroupUpdatePayload = {
  name?: string;
  accessType?: GroupAccessType;
  courseId?: string | null;
  coverFile?: File;
  description?: string | null;
  // ✅ on peut aussi la modifier ensuite
  visibility?: GroupVisibility;
};

type Session = { token?: string } | null;

function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* -------- LISTE -------- */

export async function listGroups(communityId: string): Promise<GroupLite[]> {
  const params = new URLSearchParams({ communityId });

  const res = await fetch(
    `${API_BASE}/communaute/groups?${params.toString()}`,
    {
      method: "GET",
      headers: {
        ...authHeaders(),
      },
    }
  );

  if (!res.ok) {
    throw new Error("Impossible de charger les groupes.");
  }

  const json = (await res.json()) as GroupsListResponse;

  if (!json.ok || !json.data) {
    throw new Error(json.error || "Impossible de charger les groupes.");
  }

  // On renvoie tel quel, avec les champs optionnels (description, stats, visibility…)
  return json.data.items;
}

/* -------- CRÉATION -------- */

export async function createGroup(
  communityId: string,
  payload: GroupCreatePayload
): Promise<GroupLite> {
  const fd = new FormData();

  fd.append("communityId", communityId);

  // ✅ on récupère visibility aussi
  const { name, accessType, courseId, description, visibility } = payload;

  const jsonPayload: Record<string, unknown> = {
    name,
    accessType,
    courseId,
  };

  if (description !== undefined) {
    jsonPayload.description = description;
  }

  // ✅ si le front a choisi "public" ou "private", on l’envoie
  if (visibility !== undefined) {
    jsonPayload.visibility = visibility;
  }

  fd.append("payload", JSON.stringify(jsonPayload));

  if (payload.coverFile) {
    fd.append("cover", payload.coverFile);
  }

  const res = await fetch(`${API_BASE}/communaute/groups`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: fd,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Création du groupe impossible.");
  }

  const json = (await res.json()) as {
    ok: boolean;
    data?: GroupLite;
    error?: string;
  };

  if (!json.ok || !json.data) {
    throw new Error(json.error || "Création du groupe impossible.");
  }

  return json.data;
}

/* -------- MISE À JOUR -------- */

export async function updateGroup(
  groupId: string,
  payload: GroupUpdatePayload
): Promise<GroupLite> {
  const fd = new FormData();

  const jsonPayload: Record<string, unknown> = {};

  if (payload.name !== undefined) jsonPayload.name = payload.name;
  if (payload.accessType !== undefined)
    jsonPayload.accessType = payload.accessType;
  if (payload.courseId !== undefined) jsonPayload.courseId = payload.courseId;
  if (payload.description !== undefined)
    jsonPayload.description = payload.description;

  // ✅ on prend aussi visibility si elle a été modifiée
  if (payload.visibility !== undefined) {
    jsonPayload.visibility = payload.visibility;
  }

  fd.append("payload", JSON.stringify(jsonPayload));

  if (payload.coverFile) {
    fd.append("cover", payload.coverFile);
  }

  const res = await fetch(`${API_BASE}/communaute/groups/${groupId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
    },
    body: fd,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Mise à jour du groupe impossible.");
  }

  const json = (await res.json()) as {
    ok: boolean;
    data?: GroupLite;
    error?: string;
  };

  if (!json.ok || !json.data) {
    throw new Error(json.error || "Mise à jour du groupe impossible.");
  }

  return json.data;
}

/* -------- SUPPRESSION -------- */

export async function deleteGroup(groupId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/communaute/groups/${groupId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Suppression du groupe impossible.");
  }
}
