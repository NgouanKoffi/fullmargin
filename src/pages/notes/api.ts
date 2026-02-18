// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notes\api.ts
import { api, ApiError } from "../../lib/api";

/* ====================== Types ====================== */

export type NoteListItem = {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
};

export type NoteDoc = {
  id: string;
  title: string;
  doc: unknown; // ← plus de "any"
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type NotePatchPayload = {
  title?: string;
  doc?: unknown; // ← plus de "any"
  pinned?: boolean;
  tags?: string[];
};

/* ====================== Helpers sûrs ====================== */

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null;

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isRec(cur) || !(k in cur)) return undefined;
    cur = (cur as Rec)[k];
  }
  return cur;
}

function asString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === "string" ? v : String(v);
}

function asBool(v: unknown): boolean {
  return Boolean(v);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function pickId(obj: unknown): string | undefined {
  const from =
    get(obj, ["id"]) ??
    get(obj, ["_id"]) ??
    (isRec(get(obj, ["note"]))
      ? get(obj, ["note", "id"]) ?? get(obj, ["note", "_id"])
      : undefined) ??
    (isRec(get(obj, ["data"]))
      ? get(obj, ["data", "id"]) ?? get(obj, ["data", "_id"])
      : undefined);

  return asString(from);
}

function pickUpdatedAt(obj: unknown): string | undefined {
  const v =
    get(obj, ["updatedAt"]) ??
    (isRec(get(obj, ["note"])) ? get(obj, ["note", "updatedAt"]) : undefined) ??
    (isRec(get(obj, ["data"])) ? get(obj, ["data", "updatedAt"]) : undefined);

  return asString(v);
}

function pickItemsArray(obj: unknown): unknown[] | undefined {
  if (Array.isArray(obj)) return obj;
  if (isRec(obj)) {
    const direct = obj.items;
    if (Array.isArray(direct)) return direct as unknown[];
    const data = obj.data;
    if (isRec(data) && Array.isArray(data.items))
      return data.items as unknown[];
  }
  return undefined;
}

function pickNoteObject(obj: unknown): Rec | undefined {
  if (!isRec(obj)) return undefined;

  const maybeNote = (obj as Rec)["note"];
  if (isRec(maybeNote)) return maybeNote;

  const data = (obj as Rec)["data"];
  if (isRec(data)) {
    const dataNote = (data as Rec)["note"];
    if (isRec(dataNote)) return dataNote;
  }

  // forme "plate" { title, doc, ... }
  if ("doc" in obj || "title" in obj) return obj as Rec;

  return undefined;
}

/** Si {ok:true} → renvoie data, si {ok:false} → lève ApiError, sinon renvoie brut */
function normalize<T = unknown>(raw: unknown): T {
  if (isRec(raw) && "ok" in raw) {
    const okVal = raw.ok;
    if (okVal === true) {
      return (("data" in raw ? (raw as Rec).data : {}) as T) ?? ({} as T);
    }
    const msg =
      asString((raw as Rec).error) ??
      asString((raw as Rec).message) ??
      "Erreur API";
    // on lève ApiError même si HTTP=200, pour homogénéité côté appelant
    throw new ApiError(
      400,
      msg ?? "Erreur API",
      raw,
      "(client-normalize)",
      new Headers()
    );
  }
  return raw as T;
}

/* ====================== Pickers ====================== */

function pickList(j: unknown): {
  items: NoteListItem[];
  nextCursor: string | null;
} {
  const d = normalize<unknown>(j);
  const arr = pickItemsArray(d);
  if (!arr) throw new Error("Réponse inattendue (liste)");

  const next =
    asString(get(d, ["nextCursor"])) ??
    asString(get(d, ["data", "nextCursor"])) ??
    null;

  const items: NoteListItem[] = arr.map((row) => {
    const r = isRec(row) ? row : {};
    const id =
      pickId(r) ??
      asString((r as Rec)["id"]) ??
      asString((r as Rec)["_id"]) ??
      "";
    const title = asString(r["title"]) ?? "Sans titre";
    const updatedAt = asString(r["updatedAt"]) ?? "";
    const pinned = asBool(r["pinned"]);
    const tags = asStringArray(r["tags"]);

    return { id, title, updatedAt, pinned, tags };
  });

  return { items, nextCursor: next };
}

function pickNote(j: unknown): NoteDoc {
  const d = normalize<unknown>(j);
  const n = pickNoteObject(d);
  if (!n) throw new Error("Réponse inattendue (note)");

  return {
    id: pickId(n) ?? asString(n.id) ?? asString(n._id) ?? "",
    title: asString(n.title) ?? "Sans titre",
    doc: n.doc, // type unknown — passe-plat
    pinned: asBool(n.pinned),
    tags: asStringArray(n.tags),
    createdAt: asString(n.createdAt) ?? "",
    updatedAt: asString(n.updatedAt) ?? "",
  };
}

function pickIdUpdated(j: unknown): { id: string; updatedAt: string } {
  const d = normalize<unknown>(j);
  const id = pickId(d);
  const updatedAt = pickUpdatedAt(d) ?? "";
  if (!id) throw new Error("Réponse inattendue (création)");
  return { id, updatedAt };
}

function pickUpdated(j: unknown): { updatedAt: string } {
  const d = normalize<unknown>(j);
  const u = pickUpdatedAt(d);
  if (u === undefined) throw new Error("Réponse inattendue (mise à jour)");
  return { updatedAt: u };
}

function pickDeleted(j: unknown): { deleted: boolean } {
  const d = normalize<unknown>(j);
  const del = get(d, ["deleted"]) ?? get(d, ["data", "deleted"]);
  return { deleted: asBool(del) };
}

/* ====================== API calls ====================== */

export async function listNotes(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
  pinned?: boolean;
}) {
  const j = await api.get("/notes", { query: params, cache: "no-store" });
  return pickList(j);
}

export async function getNote(id: string) {
  const j = await api.get(`/notes/${id}`, { cache: "no-store" });
  return pickNote(j);
}

export async function createNote(payload: NotePatchPayload) {
  const j = await api.post("/notes", payload);
  return pickIdUpdated(j);
}

export async function updateNote(id: string, payload: NotePatchPayload) {
  const j = await api.patch(`/notes/${id}`, payload);
  return pickUpdated(j);
}

export async function deleteNote(id: string) {
  const j = await api.delete(`/notes/${id}`);
  return pickDeleted(j);
}
