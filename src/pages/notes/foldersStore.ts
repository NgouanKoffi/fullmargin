import { api, ApiError } from "../../lib/api";

/* ============== Types ============== */
export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/* ============== Helpers sûrs (copie light de api.ts) ============== */
type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null;
const get = (o: unknown, path: string[]): unknown => {
  let cur: unknown = o;
  for (const k of path) {
    if (!isRec(cur) || !(k in cur)) return undefined;
    cur = (cur as Rec)[k];
  }
  return cur;
};
const asString = (v: unknown): string | undefined =>
  v == null ? undefined : typeof v === "string" ? v : String(v);

/** Si {ok:true} → renvoie data, si {ok:false} → lève ApiError, sinon renvoie brut */
function normalize<T = unknown>(raw: unknown): T {
  if (isRec(raw) && "ok" in raw) {
    if ((raw as Rec).ok === true) {
      return (("data" in raw ? (raw as Rec).data : {}) as T) ?? ({} as T);
    }
    const msg =
      asString((raw as Rec).error) ??
      asString((raw as Rec).message) ??
      "Erreur API";
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

function pickFolders(j: unknown): Folder[] {
  const d = normalize<unknown>(j);
  const arr = (get(d, ["items"]) ?? get(d, ["data", "items"])) as unknown;
  const rows = Array.isArray(arr) ? arr : [];
  return rows.map((r) => {
    const x = isRec(r) ? r : {};
    return {
      id: asString(get(x, ["id"])) ?? asString(get(x, ["_id"])) ?? "",
      name: asString(get(x, ["name"])) ?? "Nouveau dossier",
      parentId: (asString(get(x, ["parentId"])) ?? null) as string | null,
      createdAt: asString(get(x, ["createdAt"])) ?? "",
      updatedAt: asString(get(x, ["updatedAt"])) ?? "",
    };
  });
}

function pickFolder(j: unknown): Folder {
  const d = normalize<unknown>(j);
  const f = (get(d, ["folder"]) ?? get(d, ["data", "folder"])) as unknown;
  const x = isRec(f) ? f : {};
  return {
    id: asString(get(x, ["id"])) ?? asString(get(x, ["_id"])) ?? "",
    name: asString(get(x, ["name"])) ?? "Nouveau dossier",
    parentId: (asString(get(x, ["parentId"])) ?? null) as string | null,
    createdAt: asString(get(x, ["createdAt"])) ?? "",
    updatedAt: asString(get(x, ["updatedAt"])) ?? "",
  };
}

function pickMap(j: unknown): Record<string, string | null> {
  const d = normalize<unknown>(j);
  const m = (get(d, ["map"]) ?? get(d, ["data", "map"])) as unknown;
  if (!isRec(m)) return {};
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(m)) {
    out[k] = asString(v) ?? null;
  }
  return out;
}

/* ============== API calls ============== */

export async function listFolders(): Promise<Folder[]> {
  const j = await api.get("/folders", { cache: "no-store" });
  return pickFolders(j);
}

export async function createFolder(input: {
  name: string;
  parentId?: string | null;
}): Promise<Folder> {
  const j = await api.post("/folders", {
    name: input.name,
    parentId: input.parentId ?? null,
  });
  return pickFolder(j);
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await api.patch(`/folders/${id}`, { name });
}

export async function moveFolder(
  id: string,
  parentId: string | null
): Promise<void> {
  await api.patch(`/folders/${id}`, { parentId });
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete(`/folders/${id}`);
}

export async function listNoteFolderMap(): Promise<
  Record<string, string | null>
> {
  const j = await api.get("/folders/map", { cache: "no-store" });
  return pickMap(j);
}

export async function setNoteFolderId(
  noteId: string,
  folderId: string | null
): Promise<void> {
  await api.patch(`/folders/map/${noteId}`, { folderId });
}

/** Optionnel (sinon utilise listNoteFolderMap et lis la clé) */
export async function getNoteFolderId(noteId: string): Promise<string | null> {
  const map = await listNoteFolderMap();
  return map[noteId] ?? null;
}
