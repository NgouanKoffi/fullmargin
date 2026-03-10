// backend/src/routes/debug.routes.js
const express = require("express");
const router = express.Router();

/** Ping pour vérifier la dispo / limiter */
router.get("/ping", (req, res) => res.json({ pong: true }));

/** Echo pour tester mongoSanitize / hpp / limites body */
router.post("/echo", (req, res) => {
  res.json({
    body: req.body ?? {},
    query: req.query ?? {},
  });
});

/** Boom: provoque une erreur pour tester le handler global */
router.get("/boom", (req, res, next) => {
  const err = new Error("Boom");
  err.statusCode = 500; // explicite, même si le handler met 500 par défaut
  next(err);
});

module.exports = router;