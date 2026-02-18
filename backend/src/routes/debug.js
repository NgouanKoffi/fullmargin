const express = require("express");
const router = express.Router();

/** Santé simple pour ping de debug */
router.get("/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/** Echo: renvoie body + query (sert aux tests de sanitize/hpp) */
router.post("/echo", (req, res) => {
  res.json({
    body: req.body || {},
    query: req.query || {},
  });
});

/** Boom: force une erreur pour tester le handler */
router.get("/boom", (req, res, next) => {
  const err = new Error("boom");
  err.statusCode = 500;
  next(err);
});

module.exports = router;