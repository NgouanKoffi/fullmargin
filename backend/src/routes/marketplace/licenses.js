// backend/src/routes/marketplace/licenses.js
const express = require("express");
const router = express.Router();

/**
 * IMPORTANT
 * - Ne jamais exposer ces tokens côté navigateur.
 * - Les appels doivent passer par le backend.
 *
 * Doc:
 *  - Renew: POST /api/renew_license.php avec header Authorization: Bearer <token>
 *  - Body: { license_key, duration, unit, reactivate? }
 */

// Utilise l’URL prod par défaut
const SECURE_BASE_URL =
  process.env.SECURE_LICENSES_BASE_URL || "https://secure.fullmargin.net";

// Bearer token pour le renouvellement
const RENEW_BEARER =
  process.env.SECURE_LICENSES_RENEW_BEARER ||
  process.env.SECURE_RENEW_BEARER ||
  "";

// Helper: lecture JSON safe
async function readJsonSafe(res) {
  const ct = String(res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text().catch(() => "");
  if (ct.includes("application/json")) {
    try {
      return { text, json: JSON.parse(text || "{}") };
    } catch {
      return { text, json: undefined };
    }
  }
  return { text, json: undefined };
}

// unit: accepte FR alias (doc) → normalise en "days|months|years"
function normalizeUnit(unitRaw) {
  const u = String(unitRaw || "")
    .trim()
    .toLowerCase();

  if (u === "days" || u === "day") return "days";
  if (u === "months" || u === "month") return "months";
  if (u === "years" || u === "year") return "years";

  // alias FR acceptés (doc)
  if (u === "jour" || u === "jours") return "days";
  if (u === "mois") return "months";
  if (
    u === "an" ||
    u === "ans" ||
    u === "annee" ||
    u === "années" ||
    u === "annees"
  )
    return "years";

  return ""; // invalide
}

/**
 * POST /marketplace/licenses/renew
 * body: { licenseKey, duration, unit, reactivate? }
 *
 * Réponse: on renvoie le JSON secure tel quel (success/old_expires_at/new_expires_at...)
 */
router.post("/renew", async (req, res) => {
  try {
    if (!RENEW_BEARER) {
      return res.status(500).json({
        success: false,
        error: "SERVER_CONFIG",
        message:
          "Missing SECURE_LICENSES_RENEW_BEARER in environment variables.",
      });
    }

    const licenseKey = String(
      req.body?.licenseKey || req.body?.license_key || ""
    ).trim();

    const durationRaw = req.body?.duration;
    const duration = Number(durationRaw);

    const unit = normalizeUnit(req.body?.unit);
    const reactivate = req.body?.reactivate;

    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "licenseKey is required",
      });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "duration must be a positive number",
      });
    }
    if (!unit) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "unit must be days|months|years (or FR alias: jours|mois|ans)",
      });
    }

    const url = `${SECURE_BASE_URL}/api/renew_license.php`;

    const payload = {
      license_key: licenseKey,
      duration,
      unit,
      ...(typeof reactivate === "boolean" ? { reactivate } : {}),
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RENEW_BEARER}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await readJsonSafe(r);

    // L’API secure peut répondre success:false en 200, donc on renvoie le JSON.
    // Si HTTP non-2xx, on renvoie pareil mais en error.
    if (!r.ok) {
      return res.status(r.status).json({
        success: false,
        error: body?.json?.error || "SERVER_ERROR",
        message: body?.json?.message || body.text || "Renew license failed",
        secure: body?.json || undefined,
      });
    }

    // Normalement: {success:true, license_key, old_expires_at, new_expires_at, message}
    return res
      .status(200)
      .json(body.json || { success: false, raw: body.text });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: e instanceof Error ? e.message : "Unexpected error",
    });
  }
});

module.exports = router;
