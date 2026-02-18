const express = require("express");
const router = express.Router();

// Brevo inbound (réponses/entrants)
try {
  router.use("/brevo", require("./brevo.inbound").router);
} catch (e) {
  console.error("Failed to mount /webhooks/brevo:", e?.message || e);
}

module.exports = router;