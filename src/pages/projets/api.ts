import { api, ApiError } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";
import type { Priorite, Projet, Statut, Tache } from "./types";

/* ---------------- Helpers auth ---------------- */

function getAuthHeaders(): Record<string, string> {
  const s = loadSession();
  if (s?.token) {
    return {
      Authorization: `Bearer ${s.token}`,
    };
  }
  return {};
}

function triggerAuthModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fm:open-account"));
  }
}

/** Wrappe un appel API et déclenche le modal si 401 */
async function safeApiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // si c’est une 401 venant de notre client
    if (err instanceof ApiError && err.status === 401) {
      triggerAuthModal();
    }
    throw err;
  }
}

/* ---------------- Utils (sans any) ---------------- */

type UnknownDateInput = string | number | Date | null | undefined;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

/** Lecture sécurisée dans un objet inconnu (Record ou Array) */
function safeGet<T = unknown>(
  obj: unknown,
  path: ReadonlyArray<string | number>
): T | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (isArray(cur) && typeof key === "number") {
      cur = key >= 0 && key < cur.length ? cur[key] : undefined;
    } else if (isObject(cur) && typeof key === "string") {
      cur = key in cur ? (cur as Record<string, unknown>)[key] : undefined;
    } else {
      return undefined;
    }
    if (cur === undefined) return undefined;
  }
  return cur as T | undefined;
}

const toISO = (d: UnknownDateInput): string => {
  if (d === null || d === undefined) return "";
  const ms =
    d instanceof Date
      ? d.getTime()
      : typeof d === "number"
      ? d
      : Date.parse(String(d));
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toISOString();
};

const toStr = (v: unknown, fallback = ""): string =>
  v === null || v === undefined ? fallback : String(v);

const toBool = (v: unknown): boolean => Boolean(v);

/** Récupère un champ string non-vide de manière sûre */
function pickString(obj: unknown, key: string): string | undefined {
  if (!isObject(obj)) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Normalisation : si {ok:true} → data, si {ok:false} → ApiError, sinon brut */
function normalize<T = unknown>(raw: unknown): T {
  if (isObject(raw) && "ok" in raw) {
    const ok = Boolean((raw as Record<string, unknown>).ok);
    if (ok) {
      const data = (raw as Record<string, unknown>).data;
      return (data ?? ({} as unknown)) as T;
    }
    const msg = toStr(
      (raw as Record<string, unknown>).error ??
        (raw as Record<string, unknown>).message ??
        "Erreur API"
    );
    throw new ApiError(
      400,
      msg,
      raw,
      "(kanban-client-normalize)",
      new Headers()
    );
  }
  return raw as T;
}

/* ---------------- Types retournés côté client ---------------- */

export type ProjectListItem = {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  color?: string;
};

/* ---------------- Pickers ---------------- */

function pickProjectsList(j: unknown): {
  items: ProjectListItem[];
  nextCursor: string | null;
} {
  const d = normalize<Record<string, unknown> | unknown[]>(j);

  const arr =
    (isArray(d) ? d : undefined) ??
    safeGet<unknown[]>(d, ["items"]) ??
    safeGet<unknown[]>(d, ["data", "items"]) ??
    [];

  const items: ProjectListItem[] = arr.map((pUnknown): ProjectListItem => {
    const p = isObject(pUnknown) ? pUnknown : {};
    const id = toStr(p.id ?? (p as Record<string, unknown>)._id ?? "", "");
    const nom = toStr(p.nom ?? p.name ?? "Sans nom");
    const createdAt = toISO((p.createdAt as UnknownDateInput) ?? Date.now());
    const updatedRaw = p.updatedAt as UnknownDateInput | undefined;
    const updatedAt = updatedRaw ? toISO(updatedRaw) : undefined;
    const description = toStr((p as Record<string, unknown>).description ?? "");
    const color = toStr((p as Record<string, unknown>).color ?? "");
    return { id, nom, createdAt, updatedAt, description, color };
  });

  const nextTop = isObject(d) ? (d.nextCursor as unknown) : undefined;
  const nextData = safeGet<unknown>(d, ["data", "nextCursor"]);
  const nextCursorVal = (nextTop ?? nextData) as unknown;

  const nextCursor = typeof nextCursorVal === "string" ? nextCursorVal : null;

  return { items, nextCursor };
}

/* ---------------- API publiques ---------------- */

export async function listProjects(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}) {
  return safeApiCall(async () => {
    const j = await api.get("/kanban/projects", {
      query: params,
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    return pickProjectsList(j);
  });
}

export async function getProject(id: string): Promise<Projet> {
  return safeApiCall(async () => {
    const j = await api.get(`/kanban/projects/${id}`, {
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const pUnknown =
      safeGet<Record<string, unknown>>(d, ["project"]) ??
      safeGet<Record<string, unknown>>(d, ["data", "project"]) ??
      d;

    const p = isObject(pUnknown) ? pUnknown : {};

    const projId = toStr(p.id ?? p._id ?? "");
    const nom = toStr(p.nom ?? p.name ?? "Sans nom");
    const createdAt = toISO((p.createdAt as UnknownDateInput) ?? Date.now());
    const description = toStr((p as Record<string, unknown>).description ?? "");
    const color = toStr((p as Record<string, unknown>).color ?? "");

    const tachesArr = (isArray(p.taches) ? (p.taches as unknown[]) : []) ?? [];

    const taches: Tache[] = tachesArr.map((tUnknown) => {
      const t = isObject(tUnknown) ? tUnknown : {};
      const tid = toStr(t.id ?? t._id ?? "");
      const titre = toStr(t.titre ?? "Sans titre");
      const etiquette = toStr(t.etiquette ?? "");
      const echeanceRaw = t.echeance as UnknownDateInput | undefined;
      const echeance =
        echeanceRaw === undefined || echeanceRaw === null
          ? undefined
          : toStr(echeanceRaw);
      const priorite = (toStr(t.priorite ?? "medium") as Priorite) ?? "medium";
      const statut = (toStr(t.statut ?? "todo") as Statut) ?? "todo";
      const terminee = toBool(t.terminee);
      const imageUrl = toStr(t.imageUrl ?? "");
      const notes = toStr(t.notes ?? "");

      // ✅ icon (backend) → icone (UI)
      const icone = pickString(t, "icon") ?? pickString(t, "icone") ?? "";

      // ✅ couleur héritée éventuelle (si l’API l’enrichit)
      const projectColor = toStr(
        (t as Record<string, unknown>).projectColor ?? ""
      );

      const out: Tache = {
        id: tid,
        titre,
        etiquette,
        echeance,
        priorite,
        statut,
        terminee,
        imageUrl,
        notes,
        icone,
        projectColor,
      };
      return out;
    });

    const project: Projet = {
      id: projId,
      nom,
      createdAt,
      description,
      color,
      taches,
    };

    return project;
  });
}

/* ---------------- CRUD Projet ---------------- */

/** ✅ Envoie maintenant name + description + color directement au POST */
export async function createProject(payload: {
  name: string;
  description?: string;
  color?: string;
}) {
  return safeApiCall(async () => {
    const body: Record<string, string> = { name: payload.name };
    if (payload.description) body.description = payload.description;
    if (payload.color) body.color = payload.color;

    const j = await api.post("/kanban/projects", body, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const id = toStr(
      safeGet<unknown>(d, ["id"]) ?? safeGet<unknown>(d, ["data", "id"]) ?? ""
    );
    const updatedAt = toStr(
      safeGet<unknown>(d, ["updatedAt"]) ??
        safeGet<unknown>(d, ["data", "updatedAt"]) ??
        ""
    );
    return { id, updatedAt };
  });
}

/** Supporte name / description / color (tous optionnels) pour PATCH */
export async function updateProject(
  id: string,
  payload: { name?: string; description?: string; color?: string }
) {
  return safeApiCall(async () => {
    const body: Record<string, string> = {};
    if (typeof payload.name === "string") body.name = payload.name;
    if (typeof payload.description === "string")
      body.description = payload.description;
    if (typeof payload.color === "string") body.color = payload.color;

    const j = await api.patch(`/kanban/projects/${id}`, body, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const updatedAt = toStr(
      safeGet<unknown>(d, ["updatedAt"]) ??
        safeGet<unknown>(d, ["data", "updatedAt"]) ??
        ""
    );
    return { updatedAt };
  });
}

export async function deleteProject(id: string) {
  return safeApiCall(async () => {
    const j = await api.delete(`/kanban/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const deletedRaw =
      safeGet<unknown>(d, ["deleted"]) ??
      safeGet<unknown>(d, ["data", "deleted"]);
    return { deleted: Boolean(deletedRaw) };
  });
}

/* ---------------- CRUD Tâches ---------------- */

function pickIconFromPayload(p: unknown): string | undefined {
  return pickString(p, "icon") ?? pickString(p, "icone");
}

export async function createTask(
  payload: Partial<Tache> & { projectId: string }
): Promise<{ id: string; updatedAt: string; imageUrl: string }> {
  return safeApiCall(async () => {
    const base: Record<string, unknown> = {
      projectId: payload.projectId,
      titre: payload.titre ?? "Nouvelle tâche",
      etiquette: payload.etiquette ?? "",
      echeance: payload.echeance ?? null,
      priorite: (payload.priorite ?? "medium") as Priorite,
      statut: (payload.statut ?? "todo") as Statut,
      terminee: Boolean(payload.terminee),
      imageUrl: payload.imageUrl ?? "",
      notes: payload.notes ?? "",
    };

    // ✅ mappe 'icone' / 'icon' → 'icon' pour l’API
    const iconVal = pickIconFromPayload(payload);
    const body = iconVal ? { ...base, icon: iconVal } : base;

    const j = await api.post("/kanban/tasks", body, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const id = toStr(
      safeGet<unknown>(d, ["id"]) ?? safeGet<unknown>(d, ["data", "id"]) ?? ""
    );
    const updatedAt = toStr(
      safeGet<unknown>(d, ["updatedAt"]) ??
        safeGet<unknown>(d, ["data", "updatedAt"]) ??
        ""
    );
    const imageUrl = toStr(
      safeGet<unknown>(d, ["imageUrl"]) ??
        safeGet<unknown>(d, ["data", "imageUrl"]) ??
        ""
    );
    return { id, updatedAt, imageUrl };
  });
}

export async function updateTask(
  id: string,
  payload: Partial<Tache> & { projectId?: string }
): Promise<{ updatedAt: string; imageUrl: string }> {
  return safeApiCall(async () => {
    // on retire explicitement une éventuelle clé 'icone'
    const rest: Record<string, unknown> = {
      ...(payload as Record<string, unknown>),
    };
    delete rest.icone;

    const iconVal = pickIconFromPayload(payload);
    const body: Record<string, unknown> = iconVal
      ? { ...rest, icon: iconVal }
      : rest;

    const j = await api.patch(`/kanban/tasks/${id}`, body, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const updatedAt = toStr(
      safeGet<unknown>(d, ["updatedAt"]) ??
        safeGet<unknown>(d, ["data", "updatedAt"]) ??
        ""
    );
    const imageUrl = toStr(
      safeGet<unknown>(d, ["imageUrl"]) ??
        safeGet<unknown>(d, ["data", "imageUrl"]) ??
        ""
    );
    return { updatedAt, imageUrl };
  });
}

export async function deleteTask(id: string) {
  return safeApiCall(async () => {
    const j = await api.delete(`/kanban/tasks/${id}`, {
      headers: getAuthHeaders(),
    });
    const d = normalize<Record<string, unknown>>(j);

    const deletedRaw =
      safeGet<unknown>(d, ["deleted"]) ??
      safeGet<unknown>(d, ["data", "deleted"]);
    return { deleted: Boolean(deletedRaw) };
  });
}
