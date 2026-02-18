// backend/src/services/bunny.service.js
const axios = require("axios");
const fs = require("fs");

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_NAME;
const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST;
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL;

const BASE_URL = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}`;

module.exports = {
  async upload(localPath, fileName) {
    const data = fs.readFileSync(localPath);

    const url = `${BASE_URL}/${fileName}`;
    await axios.put(url, data, {
      headers: {
        AccessKey: BUNNY_STORAGE_KEY,
        "Content-Type": "application/octet-stream",
      },
    });

    return `${BUNNY_CDN_URL}/${fileName}`;
  },

  async delete(fileName) {
    await axios.delete(`${BASE_URL}/${fileName}`, {
      headers: { AccessKey: BUNNY_STORAGE_KEY },
    });
  },

  cdn(fileName) {
    return `${BUNNY_CDN_URL}/${fileName}`;
  },
};
