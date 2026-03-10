// backend/src/routes/payments/crypto.js
"use strict";

const express = require("express");
const router = express.Router();

// On importe notre nouvelle logique core
const { createManualCryptoIntent } = require("./crypto.core");

/* ------------------------- requireAuth loader (robuste) ------------------------- */
function loadRequireAuth() {
  const candidates = [
    "../../middlewares/requireAuth",
    "../../middleware/requireAuth",
    "../../middlewares/auth",
    "../middlewares/requireAuth",
    "../middleware/requireAuth",
  ];

  for (const p of candidates) {
    try {
      const mod = require(p);
      const fn = mod?.requireAuth || mod?.default || mod;
      if (typeof fn === "function") return fn;
    } catch {
      // ignore
    }
  }
  return null;
}

const requireAuth = loadRequireAuth();

function mustAuth(req, res, next) {
  if (!requireAuth) {
    return res.status(500).json({
      ok: false,
      error: "requireAuth introuvable. Vérifie le chemin du middleware.",
    });
  }
  return requireAuth(req, res, next);
}

/* ------------------------- Routes ------------------------- */

/**
 * POST /api/payments/crypto/create-intent
 * ✅ Privé : User connecté obligatoire
 */
router.post(
  "/crypto/create-intent",
  mustAuth,
  express.json(),
  createManualCryptoIntent,
);

// Alias optionnel
router.post(
  "/crypto/create",
  mustAuth,
  express.json(),
  createManualCryptoIntent,
);

// ✅ IMPORTANT : export DIRECT du router (comme les autres fichiers)
module.exports = router;
