// src/pages/communaute/private/community-details/tabs/Formations/formations.api.ts
import type { CourseDraft, CurriculumItem, Lesson, Module } from "./types";
import type { CI } from "./formations.media";
import {
  isRealFile,
  reviveFile,
  dataUrlToBlob,
  stripItemToMinimal,
} from "./formations.media";
import { loadSession } from "../../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../../lib/api";

/* ===== Types ===== */
export type CourseSaved = {
  id: string;
  createdAt: string;
  updatedAt: string;
  communityId?: string;
  ownerId?: string;
  coverUrl?: string;
  title: string;
  level: string;
  learnings: string[];
  shortDesc?: string;
  description?: string;
  modules?: Array<{
    id: string;
    title: string;
    description?: string;
    lessons?: Array<{
      id: string;
      title: string;
      description?: string;
      items?: Array<{
        id: string;
        type: "video" | "pdf" | "image";
        subtype?: string | null;
        title: string;
        url?: string;
        publicId?: string;
        durationMin?: number;
      }>;
    }>;
  }>;
  priceType: "free" | "paid";
  currency?: string;
  price?: number;

  visibility?: "public" | "private"; // 👈 nouveau
};

function authHeaders(): HeadersInit {
  const t = loadSession()?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ===== Multipart builder ===== */
type ItemForPayload = CurriculumItem & { fileKey?: string };
type LessonPayload = Omit<Lesson, "items"> & { items: ItemForPayload[] };
type ModulePayload = Omit<Module, "lessons"> & { lessons: LessonPayload[] };

function extractErrorMessage(x: unknown): string | null {
  if (x && typeof x === "object" && "error" in x) {
    const v = (x as Record<string, unknown>).error;
    return typeof v === "string" ? v : null;
  }
  return null;
}

export async function buildMultipartFromDraft(
  method: "POST" | "PUT",
  draft: CourseDraft,
  params: { communityId?: string }
): Promise<FormData> {
  const fd = new FormData();

  /* ---------- Cover ---------- */
  if (draft.coverFile) {
    fd.append("cover", draft.coverFile);
  } else if (draft.coverPreview) {
    if (draft.coverPreview.startsWith("data:")) {
      try {
        const blob = dataUrlToBlob(draft.coverPreview);
        const nameGuess =
          blob.type && blob.type.includes("png")
            ? "cover.png"
            : blob.type && blob.type.includes("jpeg")
            ? "cover.jpg"
            : "cover";
        fd.append(
          "cover",
          new File([blob], nameGuess, {
            type: blob.type || "application/octet-stream",
          })
        );
      } catch {
        /* ignore */
      }
    }
  }

  /* ---------- Modules + fichiers ---------- */
  const modulesOut: ModulePayload[] = (draft.modules || []).map(
    (m: Module) => ({
      ...m,
      lessons: (m.lessons || []).map((l: Lesson) => ({
        ...l,
        items: ((l.items as unknown as CI[]) || []).map((it: CI) => {
          const minimal = stripItemToMinimal(it);
          const out: ItemForPayload = {
            ...minimal,
            url: minimal.url || undefined,
          };

          let real: File | null = null;

          if (isRealFile(it.file)) {
            real = it.file!;
          } else if (it.__serializedFile) {
            real = reviveFile(it.__serializedFile);
          }

          if (real) {
            const key = `files[f_${it.id}]`;
            fd.append(key, real);
            out.fileKey = key;
          }

          return out;
        }),
      })),
    })
  );

  const payload: Record<string, unknown> = {
    title: draft.title,
    level: draft.level,
    learnings: draft.learnings,
    longDesc: draft.longDesc,
    modules: modulesOut,
    priceType: draft.priceType,
    currency: draft.currency,
    price: draft.price,
    visibility: draft.visibility ?? "public", // 👈 on envoie la visibilité
  };

  if (draft.coverPreview && /^https?:\/\//i.test(draft.coverPreview)) {
    payload.coverUrl = draft.coverPreview;
  }
  if (method === "POST") {
    payload.communityId = params.communityId;
  }

  fd.append("payload", JSON.stringify(payload));
  return fd;
}

/* ===== API calls ===== */
export async function listCourses(communityId: string) {
  const res = await fetch(
    `${API_BASE}/communaute/courses?communityId=${encodeURIComponent(
      communityId
    )}`,
    { headers: { ...authHeaders() } }
  );
  if (!res.ok) throw new Error("Cours introuvables");
  const json = (await res.json()) as { data?: { items?: CourseSaved[] } };
  return json?.data?.items ?? [];
}

export async function updateGroupCover(groupId: string, coverUrl: string) {
  if (!groupId || !coverUrl) return;
  const res = await fetch(
    `${API_BASE}/communaute/groups/${encodeURIComponent(groupId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ coverUrl }),
    }
  );
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j?.error || "Impossible de mettre à jour la cover du groupe";
    throw new Error(msg);
  }
}

export async function createCourseMultipart(
  communityId: string,
  draft: CourseDraft
) {
  const fd = await buildMultipartFromDraft("POST", draft, { communityId });
  const res = await fetch(`${API_BASE}/communaute/courses`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });

  if (!res.ok) {
    const ejson = (await res.json().catch(() => null)) as unknown;
    throw new Error(extractErrorMessage(ejson) || "Création impossible");
  }

  const json = (await res.json()) as {
    data: CourseSaved & {
      groupId?: string;
      linkedGroupId?: string;
      group?: { id?: string };
    };
  };

  const created = json.data;
  const groupId =
    created.groupId || created.linkedGroupId || created.group?.id || "";

  if (groupId && created.coverUrl) {
    try {
      await updateGroupCover(groupId, created.coverUrl);
    } catch {
      /* ignore erreur de cover */
    }
  }

  return created;
}

export async function updateCourseMultipart(id: string, draft: CourseDraft) {
  const fd = await buildMultipartFromDraft("PUT", draft, {});
  const res = await fetch(`${API_BASE}/communaute/courses/${id}`, {
    method: "PUT",
    headers: { ...authHeaders() },
    body: fd,
  });

  if (!res.ok) {
    const ejson = (await res.json().catch(() => null)) as unknown;
    throw new Error(extractErrorMessage(ejson) || "Mise à jour impossible");
  }

  const json = (await res.json()) as { data: CourseSaved };
  return json.data;
}

export async function deleteCourse(id: string) {
  const res = await fetch(`${API_BASE}/communaute/courses/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  if (!res.ok) {
    const ejson = (await res.json().catch(() => null)) as unknown;
    throw new Error(extractErrorMessage(ejson) || "Suppression impossible");
  }

  return true;
}
