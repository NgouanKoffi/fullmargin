// backend/src/utils/storage.gdrive.js
const { google } = require("googleapis");
const stream = require("stream");

const GDRIVE_ROOT_FOLDER_ID = process.env.GDRIVE_ROOT_FOLDER_ID;

// 🔐 Auth: utilise le fichier JSON pointé par GOOGLE_APPLICATION_CREDENTIALS
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

function bufferToStream(buffer) {
  const readable = new stream.PassThrough();
  readable.end(buffer);
  return readable;
}

/**
 * Upload générique vers Drive
 * Retourne l'objet file Drive (id, webViewLink, webContentLink)
 */
async function uploadBufferToDrive(buffer, { fileName, mimeType, folderId }) {
  const parents = [folderId || GDRIVE_ROOT_FOLDER_ID];

  const fileMetadata = { name: fileName, parents };
  const media = { mimeType, body: bufferToStream(buffer) };

  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink",
  });

  const file = res.data;

  // Rendre le fichier lisible par lien public
  await drive.permissions.create({
    fileId: file.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return file;
}

/**
 * ✔️ Compat Cloudinary : uploadBuffer(buffer, { folder, publicId, resourceType })
 * resourceType: "image" | "video" | "raw" | "auto"
 */
async function uploadBuffer(
  buffer,
  {
    folder = "uploads",
    publicId,
    resourceType = "image", // par défaut comme avant
    uploadOptions = {}, // on l'ignore pour Drive mais on le garde pour compat
  } = {}
) {
  let ext = "bin";
  let mimeType = "application/octet-stream";

  switch (resourceType) {
    case "image":
      ext = "jpg";
      mimeType = "image/jpeg";
      break;
    case "video":
      ext = "mp4";
      mimeType = "video/mp4";
      break;
    case "raw":
      // ex: PDF ou autres fichiers binaires
      ext = "pdf";
      mimeType = "application/pdf";
      break;
    default:
      ext = "bin";
      mimeType = "application/octet-stream";
      break;
  }

  const baseId = publicId || Date.now().toString();
  // On conserve le nom "folder_publicId.ext" pour info, mais tout va
  // dans le même dossier Drive (GDRIVE_ROOT_FOLDER_ID)
  const fileName = `${folder}_${baseId}.${ext}`;

  const file = await uploadBufferToDrive(buffer, {
    fileName,
    mimeType,
  });

  return {
    public_id: file.id,
    secure_url: file.webContentLink || file.webViewLink,
  };
}

/** ✔️ Image (wrapper sur uploadBuffer) */
async function uploadImageBuffer(buffer, { folder = "images", publicId } = {}) {
  return uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "image",
  });
}

/** ✔️ Vidéo (wrapper sur uploadBuffer) */
async function uploadVideoBuffer(buffer, { folder = "videos", publicId } = {}) {
  return uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "video",
  });
}

/** ✔️ PDF (wrapper sur uploadBuffer avec resourceType=raw) */
async function uploadPdfBuffer(buffer, { folder = "pdf", publicId } = {}) {
  const res = await uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "raw",
  });

  console.log("[PDF UPLOAD GDRIVE]", {
    folder,
    askedPublicId: publicId,
    returnedId: res.public_id,
    url: res.secure_url,
  });

  return res;
}

/** Optionnel: à implémenter plus tard si besoin */
async function uploadAvatarFromUrl(url, publicId, folder = "avatars") {
  // On pourra plus tard :
  // - télécharger l'image (axios/fetch → buffer)
  // - appeler uploadImageBuffer(buffer, { folder, publicId })
  throw new Error("uploadAvatarFromUrl non implémenté pour Google Drive");
}

module.exports = {
  uploadBuffer, // 👈 IMPORTANT pour /profile/avatar, /cover, etc.
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
  uploadAvatarFromUrl,
};
