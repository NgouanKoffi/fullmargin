// backend/src/app.js
const express = require("express");
const path = require("path");
const compression = require("compression");
const { applySecurity } = require("./middlewares/security");
const { applyLogger } = require("./middlewares/logger");
const { notFound, errorHandler } = require("./middlewares/errors");
const routes = require("./routes");
const { NODE_ENV } = require("./config/env");

const app = express();

/* -------------------------------------------------------
   Sécurité & logs
-------------------------------------------------------- */
applySecurity(app);
applyLogger(app);

/* -------------------------------------------------------
   🔵 WEBHOOK STRIPE (RAW BODY — AVANT express.json)
-------------------------------------------------------- */
try {
  const { stripeWebhookCore } = require("./routes/payments/stripe.core");
  app.post(
    "/api/payments/stripe/webhook",
    express.raw({ type: "*/*", limit: "2mb" }),
    stripeWebhookCore,
  );
  console.log("[stripe] webhook mounted at /api/payments/stripe/webhook");
} catch (e) {
  console.error("[stripe] failed to mount webhook:", e?.message || e);
}

/* -------------------------------------------------------
   Parsers JSON (APRES webhooks RAW)
-------------------------------------------------------- */
app.use(
  express.json({
    limit: "100mb",
    type: ["application/json", "application/*+json", "text/plain"],
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "100mb",
  }),
);

// Fallback string → JSON
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // ignore
    }
  }
  next();
});

/* -------------------------------------------------------
   Compression
-------------------------------------------------------- */
app.use(compression());

/* -------------------------------------------------------
   Fichiers statiques
-------------------------------------------------------- */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: NODE_ENV === "production" ? "1d" : 0,
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader(
        "Cache-Control",
        NODE_ENV === "production" ? "public, max-age=86400" : "no-store",
      );
    },
  }),
);

/* -------------------------------------------------------
   Routes API (APRÈS webhooks & après les parsers JSON)
-------------------------------------------------------- */
app.use("/api", routes);

/* -------------------------------------------------------
   Debug en test
-------------------------------------------------------- */
if (NODE_ENV === "test") {
  app.use("/api/debug", require("./routes/debug"));
}

/* -------------------------------------------------------
   Jobs / Scheduler
-------------------------------------------------------- */
if (NODE_ENV !== "test") {
  try {
    const { startScheduler } = require("./jobs/mailer.scheduler");
    startScheduler();
    console.log("[jobs] mailer.scheduler started");
  } catch (e) {
    console.error("[jobs] failed to start mailer.scheduler:", e?.message || e);
  }

  try {
    const { startMailboxImap } = require("./jobs/mailbox.imap");
    startMailboxImap();
    console.log("[jobs] mailbox.imap started");
  } catch (e) {
    console.error("[jobs] failed to start mailbox.imap:", e?.message || e);
  }

  try {
    const { startPublishScheduler } = require("./jobs/publishScheduledPosts");
    startPublishScheduler({ intervalMs: 30000 });
    console.log("[jobs] publishScheduledPosts started");
  } catch (e) {
    console.error(
      "[jobs] failed to start publishScheduledPosts:",
      e?.message || e,
    );
  }
}

/* -------------------------------------------------------
   Healthcheck
-------------------------------------------------------- */
app.get("/health", (_req, res) => res.json({ ok: true, env: NODE_ENV }));

/* -------------------------------------------------------
   404 + erreurs
-------------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
