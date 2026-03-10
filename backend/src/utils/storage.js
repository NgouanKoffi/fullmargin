// backend/src/utils/storage.js
const provider = process.env.STORAGE_PROVIDER || "cloudinary";

let impl;
if (provider === "gdrive") {
  impl = require("./storage.gdrive");
} else if (provider === "bunny") {
  impl = require("./storage.bunny"); // 👈 nouveau
} else {
  // par défaut → cloudinary (legacy)
  impl = require("./storage.cloudinary");
}

module.exports = impl;
