// backend/src/utils/imageVariants.js
const sharp = require("sharp");
const { uploadImageBuffer } = require("./storage"); // <-- tu as déjà ça

const VARIANTS = [
  { w: 320, q: 72, key: "320" },
  { w: 640, q: 75, key: "640" },
  { w: 960, q: 78, key: "960" },
  { w: 1280, q: 80, key: "1280" },
];

async function toWebp(buffer, width, quality) {
  return sharp(buffer)
    .rotate() // corrige EXIF
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

/**
 * Retourne:
 * {
 *   src: "url_640",
 *   srcset: { "320": "...", "640": "...", ... },
 *   w: <origWidth>, h: <origHeight>, format: "webp"
 * }
 */
async function uploadImageWithVariants(inputBuffer, { folder, publicIdBase }) {
  const meta = await sharp(inputBuffer).rotate().metadata();

  const srcset = {};
  let src = "";

  for (const v of VARIANTS) {
    const out = await toWebp(inputBuffer, v.w, v.q);

    // IMPORTANT: adapte si ton uploadImageBuffer n'accepte pas folder/publicId comme ça
    const up = await uploadImageBuffer(out, {
      folder,
      publicId: `${publicIdBase}_${v.key}`,
    });

    const url = up?.secure_url || up?.url || "";
    if (url) {
      srcset[v.key] = url;
      if (v.w === 640) src = url;
    }
  }

  if (!src) src = srcset["320"] || srcset["960"] || srcset["1280"] || "";

  return {
    src,
    srcset,
    w: meta?.width ?? null,
    h: meta?.height ?? null,
    format: "webp",
  };
}

module.exports = { uploadImageWithVariants };
