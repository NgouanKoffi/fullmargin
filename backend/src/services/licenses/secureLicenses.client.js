// backend/src/services/licenses/secureLicenses.client.js
const DEFAULT_BASE = "https://secure.fullmargin.net";

function must(v, name) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const BASE_URL = (process.env.SECURE_LICENSES_BASE_URL || DEFAULT_BASE).replace(
  /\/$/,
  ""
);
const ISSUE_API_KEY = process.env.SECURE_LICENSES_ISSUE_API_KEY; // X-API-Key
const RENEW_BEARER = process.env.SECURE_LICENSES_RENEW_BEARER_TOKEN; // Authorization Bearer

const DEBUG = process.env.SECURE_LICENSES_DEBUG === "1";

function redactHeaders(headers) {
  const h = { ...(headers || {}) };
  if (h["X-API-Key"]) h["X-API-Key"] = "***redacted***";
  if (h.Authorization) h.Authorization = "***redacted***";
  return h;
}

async function postJson(url, headers, body) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    if (DEBUG) {
      console.log("[SECURE_LICENSES][REQ]", url, redactHeaders(headers), body);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (DEBUG) {
      console.log("[SECURE_LICENSES][RES]", url, res.status, json || text);
    }

    // ⚠️ Si HTTP pas ok -> erreur
    if (!res.ok) {
      const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    // ✅ Même si HTTP 200, le provider peut renvoyer ok:false -> on laisse le caller décider
    return json || { raw: text };
  } finally {
    clearTimeout(t);
  }
}

async function issueLicense(payload) {
  must(ISSUE_API_KEY, "SECURE_LICENSES_ISSUE_API_KEY");
  return postJson(
    `${BASE_URL}/api/issue_license.php`,
    { "X-API-Key": ISSUE_API_KEY },
    payload
  );
}

async function renewLicense(payload) {
  must(RENEW_BEARER, "SECURE_LICENSES_RENEW_BEARER_TOKEN");
  return postJson(
    `${BASE_URL}/api/renew_license.php`,
    { Authorization: `Bearer ${RENEW_BEARER}` },
    payload
  );
}

module.exports = { issueLicense, renewLicense };
