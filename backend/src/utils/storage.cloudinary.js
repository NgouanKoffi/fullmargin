// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\utils\storage.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** ✔️ depuis une URL distante (ex: avatar Google) */
async function uploadAvatarFromUrl(url, publicId, folder = "avatars") {
  if (!url) return "";
  const res = await cloudinary.uploader.upload(url, {
    folder,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    fetch_format: "auto",
    quality: "auto",
    dpr: "auto",
  });
  return res.secure_url;
}

/** Helper générique buffer -> Cloudinary (resource_type paramétrable) */
function uploadBuffer(
  buffer,
  {
    folder = "uploads",
    publicId,
    resourceType = "image", // "image" | "video" | "raw" | "auto"
    uploadOptions = {},
  }
) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          resource_type: resourceType,
          fetch_format: "auto",
          quality: "auto",
          dpr: "auto",
          ...uploadOptions,
        },
        (err, res) => (err ? reject(err) : resolve(res))
      )
      .end(buffer);
  });
}

/** ✔️ Image: resource_type=image */
function uploadImageBuffer(buffer, { folder = "images", publicId }) {
  return uploadBuffer(buffer, { folder, publicId, resourceType: "image" });
}

/** ✔️ Audio “piste seule” (podcast, voix, etc.) */
function uploadAudioBuffer(buffer, { folder = "audio", publicId }) {
  return uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "video", // Cloudinary gère l'audio via resource_type=video
    uploadOptions: {
      resource_type: "video",
      overwrite: true,
      format: "mp3",
      // on autorise plusieurs formats en entrée
      allowed_formats: ["mp3", "wav", "m4a", "aac", "ogg", "flac"],
    },
  });
}

/**
 * ✔️ Vidéo: resource_type="video"
 *
 * On élargit volontairement la liste de formats autorisés :
 * - vidéos : mp4, mov, m4v, webm, mkv, avi, wmv, flv, 3gp, 3g2, mpg, mpeg...
 * - audio : mp3, wav, m4a, aac, ogg (si jamais le client met de l'audio
 *   dans une “leçon vidéo”, ça passe quand même).
 */
function uploadVideoBuffer(buffer, { folder = "videos", publicId }) {
  return uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "video",
    uploadOptions: {
      resource_type: "video",
      overwrite: true,
      allowed_formats: [
        // vidéos classiques
        "mp4",
        "mov",
        "m4v",
        "webm",
        "mkv",
        "avi",
        "wmv",
        "flv",
        "3gp",
        "3g2",
        "mpg",
        "mpeg",
        // quelques formats audio acceptés comme “video” par Cloudinary
        "mp3",
        "wav",
        "m4a",
        "aac",
        "ogg",
      ],
    },
  });
}

/** ✔️ PDF: resource_type="raw" */
async function uploadPdfBuffer(buffer, { folder = "pdf", publicId }) {
  const res = await uploadBuffer(buffer, {
    folder,
    publicId,
    resourceType: "raw",
    uploadOptions: {
      resource_type: "raw",
      format: "pdf",
      allowed_formats: ["pdf"],
    },
  });

  // Log pour vérifier exactement le public_id utilisé côté Cloudinary
  console.log("[PDF UPLOAD]", {
    folder,
    askedPublicId: publicId,
    returnedPublicId: res.public_id,
    url: res.secure_url,
  });

  return res;
}

module.exports = {
  cloudinary,
  uploadAvatarFromUrl,
  uploadBuffer,
  uploadImageBuffer,
  uploadAudioBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
};
