// backend/src/utils/storage.bunny.js
// Implémentation "storage" pour Bunny.net Storage + CDN
// Compatible avec l’interface Cloudinary utilisée dans le projet.

const axios = require("axios");

/* ================== Config ================== */

const ZONE = process.env.BUNNY_STORAGE_ZONE || process.env.BUNNY_STORAGE_NAME;

const ACCESS_KEY =
  process.env.BUNNY_STORAGE_API_KEY ||
  process.env.BUNNY_STORAGE_PASSWORD || // ⚠️ ton .env utilise ce nom
  process.env.BUNNY_STORAGE_KEY;

const CDN_HOST = process.env.BUNNY_CDN_HOST || process.env.BUNNY_CDN_URL;

// Logs de sécurité (sans afficher les secrets)
if (!ZONE) {
  console.error(
    "[BUNNY] BUNNY_STORAGE_ZONE manquant. Vérifie ton fichier .env."
  );
}
if (!ACCESS_KEY) {
  console.error(
    "[BUNNY] Aucune clé d'accès trouvée. Utilise BUNNY_STORAGE_PASSWORD (Password FTP/API de la zone)."
  );
}
if (!CDN_HOST) {
  console.warn(
    "[BUNNY] BUNNY_CDN_URL non défini. Les URLs publiques risquent d'être incorrectes."
  );
}

/* ================== Helpers ================== */

function buildStorageUrl(path) {
  return `https://storage.bunnycdn.com/${ZONE}/${path}`.replace(
    /([^:]\/)\/+/g,
    "$1"
  );
}

function buildCdnUrl(path) {
  const base = (CDN_HOST || "").replace(/\/+$/, "");
  const clean = path.replace(/^\/+/, "");
  return `${base}/${clean}`;
}

/* =======================================================================
 *  uploadBuffer
 *  Signature compatible Cloudinary:
 *    uploadBuffer(buffer, { folder, publicId, resourceType, uploadOptions })
 * ======================================================================= */
async function uploadBuffer(
  buffer,
  {
    folder = "uploads",
    publicId,
    resourceType = "image", // "image" | "video" | "raw" | ...
    extension,
    uploadOptions = {}, // ignoré mais gardé pour compatibilité
  } = {}
) {
  if (!buffer) throw new Error("No buffer");
  if (!ZONE) throw new Error("BUNNY_STORAGE_ZONE not configured");
  if (!ACCESS_KEY) throw new Error("BUNNY_STORAGE_PASSWORD / API key missing");

  if (!publicId) {
    publicId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Choix d’extension simple selon le type
  let ext = extension;
  if (!ext) {
    if (resourceType === "image") ext = "jpg";
    else if (resourceType === "video") ext = "mp4";
    else if (resourceType === "raw") ext = "bin";
    else ext = "bin";
  }

  const fileName = ext ? `${publicId}.${ext}` : publicId;
  const path = folder ? `${folder}/${fileName}` : fileName;

  const url = buildStorageUrl(path);

  const res = await axios.put(url, buffer, {
    headers: {
      AccessKey: ACCESS_KEY,
      "Content-Type": "application/octet-stream",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (res.status < 200 || res.status >= 300) {
    console.error("[BUNNY ERROR]", res.status, res.statusText, {
      url,
      path,
    });
    throw new Error(`Bunny upload failed (${res.status})`);
  }

  return {
    public_id: path,
    secure_url: buildCdnUrl(path),
  };
}

/* ================== Wrappers spécialisés ================== */

/** ✔️ Image */
function uploadImageBuffer(buffer, { folder = "images", publicId } = {}) {
  return uploadBuffer(buffer, { folder, publicId, resourceType: "image" });
}

/** ✔️ Vidéo */
function uploadVideoBuffer(buffer, { folder = "videos", publicId } = {}) {
  return uploadBuffer(buffer, { folder, publicId, resourceType: "video" });
}

/** ✔️ PDF (resource_type = raw) */
async function uploadPdfBuffer(buffer, { folder = "pdf", publicId } = {}) {
  const res = await uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "raw",
    extension: "pdf",
  });

  console.log("[PDF UPLOAD BUNNY]", {
    folder,
    askedPublicId: publicId,
    returnedPublicId: res.public_id,
    url: res.secure_url,
  });

  return res;
}

/** ✔️ Avatar depuis une URL distante (comme avant avec Cloudinary) */
async function uploadAvatarFromUrl(url, publicId, folder = "avatars") {
  if (!url) return "";
  const r = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(r.data);
  const up = await uploadImageBuffer(buffer, { folder, publicId });
  return up.secure_url;
}

/* ================== Exports ================== */

module.exports = {
  uploadBuffer,
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
  uploadAvatarFromUrl,
};
