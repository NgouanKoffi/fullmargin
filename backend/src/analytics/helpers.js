// backend/src/analytics/helpers.js
const crypto = require("crypto");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { IP_SALT = "change-me" } = process.env;

function getClientIp(req) {
  // Express "trust proxy" déjà configuré => req.ip est fiable.
  // On retire le préfixe IPv6 "::ffff:"
  return (req.ip || "")
    .replace(/^::ffff:/, "")
    .replace(/[^0-9a-fA-F\.\:]/g, "");
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(ip + IP_SALT).digest("hex");
}

function makeVisitorId(ip, uaString) {
  return crypto.createHash("sha256").update(ip + "|" + uaString + "|" + IP_SALT).digest("hex");
}

function parseUA(uaString = "") {
  const p = new UAParser(uaString);
  const browser = p.getBrowser();
  const os = p.getOS();
  const device = p.getDevice();

  let type = "desktop";
  if (device.type === "mobile") type = "mobile";
  else if (device.type === "tablet") type = "tablet";
  else if (device.type === "console" || device.type === "smarttv" || device.type === "wearable")
    type = "other";
  if (/bot|crawler|spider/i.test(uaString)) type = "bot";

  return {
    uaString,
    device: {
      type,
      browser: browser.name || "Unknown",
      browserVersion: browser.version || "",
      os: os.name || "Unknown",
      osVersion: os.version || "",
    },
  };
}

function parseUtm(search = "") {
  try {
    const qs = new URLSearchParams(search.startsWith("?") ? search : "?" + search);
    return {
      source: qs.get("utm_source") || undefined,
      medium: qs.get("utm_medium") || undefined,
      campaign: qs.get("utm_campaign") || undefined,
      term: qs.get("utm_term") || undefined,
      content: qs.get("utm_content") || undefined,
    };
  } catch {
    return {};
  }
}

function getGeo(ip) {
  try {
    const g = geoip.lookup(ip);
    if (!g) return {};
    return { country: g.country, city: g.city || undefined };
  } catch {
    return {};
  }
}

module.exports = { getClientIp, hashIp, makeVisitorId, parseUA, parseUtm, getGeo };