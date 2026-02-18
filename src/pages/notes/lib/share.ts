// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notes\lib\share.ts
import type { PartialBlock } from "@blocknote/core";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
// 👉 on force l’API sur le backend central
import { API_BASE } from "../../../lib/api";

/* ========= Types ========= */

export type SharePayloadV1 = {
  v: 1;
  title: string;
  doc: PartialBlock[];
};

/* ========= Helpers typés (pas de any) ========= */

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null;

const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;
const asNumber = (v: unknown): number | undefined =>
  typeof v === "number" ? v : undefined;

const isSharePayloadV1 = (v: unknown): v is SharePayloadV1 => {
  if (!isRec(v)) return false;
  const vv = asNumber(v["v"]);
  const title = asString(v["title"]);
  const doc = Array.isArray(v["doc"])
    ? (v["doc"] as PartialBlock[])
    : undefined;
  return vv === 1 && typeof title === "string" && Array.isArray(doc);
};

/* ========= Encode / Decode ========= */

export function encodeSharePayload(payload: SharePayloadV1): string {
  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json) ?? "";
}

export function decodeSharePayload(blob: string): SharePayloadV1 | null {
  try {
    const json = decompressFromEncodedURIComponent(blob);
    if (!json) return null;
    const obj: unknown = JSON.parse(json);
    return isSharePayloadV1(obj) ? obj : null;
  } catch {
    return null;
  }
}

/* ========= Utilitaires ========= */

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Essaie de créer un partage côté serveur pour avoir un lien court `/n/:id`.
 * API attendue: POST /api/shares/put { hash, title, blob } -> { id } ou { data:{ id } }
 */
async function tryPersistServer(
  title: string,
  blob: string
): Promise<string | null> {
  try {
    const hash = await sha256Hex(blob);
    // ⚠️ on passe maintenant par API_BASE au lieu de chemin relatif
    const res = await fetch(`${API_BASE}/shares/put`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash, title, blob }),
    });
    if (!res.ok) return null;

    const j: unknown = await res.json().catch(() => null);
    if (isRec(j)) {
      const idTop = asString(j["id"]);
      if (idTop) return idTop;

      const data = isRec(j["data"]) ? (j["data"] as Rec) : undefined;
      const idNested = data ? asString(data["id"]) : undefined;
      if (idNested) return idNested;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Construit un lien court si le serveur répond, sinon hash-fallback (#blob)
 */
export async function buildShareURL(params: {
  title: string;
  doc: PartialBlock[];
  baseHref?: string;
}): Promise<string> {
  const { title, doc, baseHref } = params;
  const payload: SharePayloadV1 = { v: 1, title, doc };
  const blob = encodeSharePayload(payload);

  // le lien final prend l’origine du front (site.fullmargin.net ou fullmargin.net)
  const origin = baseHref ?? window.location.origin;

  const id = await tryPersistServer(title, blob);
  // si le serveur a bien enregistré, on fait /n/:id sur LE FRONT
  return id ? `${origin}/n/${encodeURIComponent(id)}` : `${origin}/n#${blob}`;
}

/**
 * Résout le contenu partagé depuis l’URL courante.
 * Supporte: /n/:id  |  #blob  |  ?shared=base64(json)
 */
export async function resolveSharedFromLocation(
  loc: Location = window.location
): Promise<SharePayloadV1 | null> {
  // 1) /n/:id → GET /api/shares/get/:id -> { payload } ou { data:{ payload } } ou { blob }
  const m = loc.pathname.match(/\/n\/([^/?#]+)/);
  if (m && m[1]) {
    const id = decodeURIComponent(m[1]);
    try {
      // ⚠️ idem ici : on va chercher sur le vrai backend
      const res = await fetch(
        `${API_BASE}/shares/get/${encodeURIComponent(id)}`,
        {
          method: "GET",
        }
      );
      if (res.ok) {
        const j: unknown = await res.json().catch(() => null);
        if (isRec(j)) {
          // payload direct
          if (isSharePayloadV1(j["payload"])) {
            return j["payload"] as SharePayloadV1;
          }
          // payload dans data
          if (
            isRec(j["data"]) &&
            isSharePayloadV1((j["data"] as Rec)["payload"])
          ) {
            return (j["data"] as Rec)["payload"] as SharePayloadV1;
          }
          // blob direct
          const blobTop = asString(j["blob"]);
          if (blobTop) {
            const dec = decodeSharePayload(blobTop);
            if (dec) return dec;
          }
          // blob dans data
          if (isRec(j["data"])) {
            const blobNested = asString((j["data"] as Rec)["blob"]);
            if (blobNested) {
              const dec = decodeSharePayload(blobNested);
              if (dec) return dec;
            }
          }
        }
      }
    } catch {
      // on tente la suite
    }
  }

  // 2) Hash `#blob` (lz-string)
  if (loc.hash && loc.hash.length > 1) {
    const blob = loc.hash.slice(1);
    const dec = decodeSharePayload(blob);
    if (dec) return dec;
  }

  // 3) Legacy ?shared=base64(json)
  const sp = new URLSearchParams(loc.search);
  const shared = sp.get("shared") || sp.get("s") || "";
  if (shared) {
    try {
      const bin = atob(decodeURIComponent(shared));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const text = new TextDecoder().decode(bytes);
      const obj: unknown = JSON.parse(text);
      if (isSharePayloadV1(obj)) return obj;
    } catch {
      /* ignore */
    }
  }

  return null;
}
