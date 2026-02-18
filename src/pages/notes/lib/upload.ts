// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notes\lib\upload.ts
import type { PartialBlock } from "@blocknote/core";
import { api } from "../../../lib/api";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo

export function assertImageOrThrow(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Type non supporté (images uniquement).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image > 5 Mo.");
  }
}

/**
 * Upload d'une image de note vers le backend → Bunny
 * Backend: POST /api/notes/upload-image (route notes.js)
 * Retour attendu: { ok: true, url: "https://fullmargin-cdn.b-cdn.net/notes/..." }
 */
async function uploadImageToServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  // ⚠️ pas de /api ici, `api` préfixe déjà
  const resp = await api<{ url?: string }>("/notes/upload-image", {
    method: "POST",
    body: fd,
  });

  if (!resp?.url) {
    throw new Error("Réponse d’upload invalide.");
  }
  return resp.url;
}

/**
 * ⚠️ HISTORIQUE : avant cette fonction convertissait en DataURL.
 * Maintenant, elle :
 *  - upload chaque image locale (ObjectURL) sur le serveur,
 *  - remplace `props.url` par l’URL publique Bunny.
 *
 * La signature ne change pas pour ne pas casser les imports.
 */
export async function convertPreviewImagesToDataURLs(
  doc: PartialBlock[],
  map: Map<string, File>
): Promise<PartialBlock[]> {
  type PBlock = PartialBlock & {
    children?: PartialBlock[];
    props?: Record<string, unknown>;
  };

  // petit cache pour ne pas uploader deux fois le même fichier
  const cache = new Map<string, string>(); // key = localUrl, value = cdnUrl

  async function walk(blocks: PartialBlock[]): Promise<PartialBlock[]> {
    const out: PartialBlock[] = [];

    for (const b of blocks) {
      const nb: PBlock = { ...(b as PBlock) };

      if (
        nb.type === "image" &&
        nb.props &&
        typeof nb.props["url"] === "string"
      ) {
        const url = String(nb.props["url"]);

        if (map.has(url)) {
          const file = map.get(url)!;

          // si déjà uploadé pour ce même ObjectURL → on réutilise
          let cdnUrl = cache.get(url);
          if (!cdnUrl) {
            // optionnel : sécurité locale
            assertImageOrThrow(file);
            cdnUrl = await uploadImageToServer(file);
            cache.set(url, cdnUrl);
          }

          nb.props = { ...(nb.props || {}), url: cdnUrl };
        }
      }

      if (Array.isArray(nb.children) && nb.children.length > 0) {
        nb.children = await walk(nb.children);
      }

      out.push(nb);
    }

    return out;
  }

  return walk(doc);
}
