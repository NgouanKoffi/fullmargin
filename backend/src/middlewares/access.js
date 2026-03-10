// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\middlewares\access.js
const express = require("express");
const { verifyAuthHeader, fail, ok } = require("../routes/auth/_helpers");
const FmMetrix = require("../models/fmmetrix.model");

const router = express.Router();

router.get("/fm-metrix/access", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const sub = await FmMetrix.findOne({ userId });
    if (!sub) {
      return ok(res, { allowed: false });
    }

    const now = new Date();
    const allowed = sub.validUntil > now;

    return ok(res, {
      allowed,
      validUntil: sub.validUntil,
    });
  } catch (e) {
    console.error(e);
    return fail(res, "Erreur d'accès FM Metrix", 500);
  }
});

module.exports = router;
