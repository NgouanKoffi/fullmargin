// backend/src/analytics/routes.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const { AnalyticsEvent } = require("./models");
const AnalyticsIdentity = require("./identity.model"); // 👈 mapping visitorId <-> user
const { getGeo, parseUA } = require("./helpers");

const { IP_SALT = "dev-salt", NODE_ENV = "development" } = process.env;

/* ------------------------------------------------------------------ */
/* body parsing pour sendBeacon (text/plain) & fetch JSON              */
/* ------------------------------------------------------------------ */
// On accepte text/plain (sendBeacon) ET JSON classique, uniquement sur ce router
router.use(express.text({ type: "*/*", limit: "100kb" }));
router.use((req, res, next) => {
  if (typeof req.body === "string" && req.body.length) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: "invalid json" });
    }
  }
  next();
});

/* ------------------------------------------------------------------ */
/* utils                                                               */
/* ------------------------------------------------------------------ */
function hashIp(ip) {
  try {
    return crypto.createHmac("sha256", IP_SALT).update(ip || "").digest("hex");
  } catch {
    return "";
  }
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "";
}

/* ------------------------------------------------------------------ */
/* upserts sans conflit                                                */
/* ------------------------------------------------------------------ */
async function upsertPageview(doc) {
  // Si pas de dedupeKey → insertion simple.
  if (!doc.dedupeKey) {
    await AnalyticsEvent.create(doc);
    return;
  }
  // Dédoublonnage via dedupeKey (on n'update que si insertion)
  await AnalyticsEvent.updateOne(
    { dedupeKey: doc.dedupeKey },
    { $setOnInsert: doc },
    { upsert: true }
  );
}

async function upsertLeave(doc) {
  // Si pas de dedupeKey → insertion autonome "leave".
  if (!doc.dedupeKey) {
    const now = new Date();
    await AnalyticsEvent.create({
      ...doc,
      firstAt: now,
      lastAt: now,
    });
    return;
  }

  // Retirer les champs timeline du spread pour $max
  const {
    dedupeKey,
    durationMs = 0,
    firstAt: _ignoreFirstAt,
    lastAt: _ignoreLastAt,
    ...rest
  } = doc;

  const now = new Date();

  await AnalyticsEvent.updateOne(
    { dedupeKey },
    {
      // À l’insertion
      $setOnInsert: { ...rest, firstAt: now },
      // Toujours: on borne par le max
      $max: {
        lastAt: now,
        durationMs: Math.max(0, Number(durationMs) || 0),
      },
    },
    { upsert: true }
  );
}

/* ------------------------------------------------------------------ */
/* /analytics/identify : mappe visitorId -> user (pas une pageview)   */
/* ------------------------------------------------------------------ */
router.post("/identify", async (req, res) => {
  try {
    const b = req.body || {};
    const userId = b.userId;
    const visitorId = b.visitorId;

    if (!userId || !visitorId) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    await AnalyticsIdentity.updateOne(
      { user: userId, visitorId },
      {
        $setOnInsert: { firstSeenAt: new Date() },
        $set: { lastSeenAt: new Date(), ua: b.ua || "", ipHash },
        $inc: { seen: 1 },
      },
      { upsert: true }
    );

    // 204 = pas de contenu (et surtout pas de vue comptée)
    return res.status(204).end();
  } catch (e) {
    console.error("POST /analytics/identify:", e);
    return res.status(500).json({ ok: false });
  }
});

/* ------------------------------------------------------------------ */
/* /analytics/track : pageview | leave | consent                       */
/* ------------------------------------------------------------------ */
router.post("/track", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.type || !["pageview", "leave", "consent"].includes(b.type)) {
      return res.status(400).json({ error: "invalid type" });
    }

    // Champs minimums pour identifier le visiteur/session
    if (!b.sessionId || !b.visitorId) {
      return res.status(400).json({ error: "missing session/visitor" });
    }

    const now = b.ts ? new Date(b.ts) : new Date();
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // Enrichissements privacy-friendly
    const geo = getGeo(clientIp);          // ex: { country: "FR", city?: "Paris" }
    const uaParsed = parseUA(b.ua || "");  // ex: { device: { type, browser, os } }

    // Base commune (sans timeline)
    const baseCommon = {
      type: b.type,
      dedupeKey: b.dedupeKey, // peut être undefined (index sparse)
      path: b.path,
      referrer: b.referrer,
      url: b.url,
      search: b.search,
      title: b.title,
      lang: b.lang,
      tz: b.tz,
      screen: b.screen,
      sessionId: b.sessionId,
      visitorId: b.visitorId,
      ua: b.ua,
      hints: b.hints,
      ipHash,
      cookieConsent: b.cookieConsent || "unknown",

      // enrichissements
      country: geo?.country || undefined,
      deviceType: uaParsed?.device?.type || undefined,
      browser: uaParsed?.device?.browser || undefined,
      os: uaParsed?.device?.os || undefined,
    };

    // Pour pageview/consent, on embarque aussi la timeline initiale
    const base =
      b.type === "leave"
        ? baseCommon
        : { ...baseCommon, firstAt: now, lastAt: now };

    if (b.type === "pageview") {
      await upsertPageview(base);
      return res.status(204).end();
    }

    if (b.type === "leave") {
      const durationMs = Math.max(0, Number(b.durationMs) || 0);
      await upsertLeave({ ...base, durationMs });
      return res.status(204).end();
    }

    // type === 'consent'
    // On stocke l’état actuel pour la session, sans dédoublonnage strict.
    await AnalyticsEvent.create({
      ...base,
      // dédoublage léger possible par minute si tu veux :
      // dedupeKey: b.dedupeKey || `consent:${b.sessionId}:${new Date().toISOString().slice(0,16)}`
    });
    return res.status(204).end();
  } catch (err) {
    if (err && err.code === 11000) {
      // doublon de dedupeKey : ignore
      if (NODE_ENV !== "production") console.warn("Duplicate dedupeKey ignored");
      return res.status(204).end();
    }
    return next(err);
  }
});

module.exports = router;