const express = require("express");
const router = express.Router();

const Presence = require("../../models/presence.model");
const PresenceSession = require("../../models/presenceSession.model");
const User = require("../../models/user.model");
const { ok, fail, verifyAuthHeader } = require("../auth/_helpers");
const { getClientIp, hashIp } = require("../../utils/ip");

/* ---------- Auth ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req); // ⚠️ sync
    if (!a || !a.userId) return fail(res, "Non autorisé", 401);
    req.auth = { userId: a.userId };
    next();
  } catch {
    return fail(res, "Non autorisé", 401);
  }
}

/* ---------- Const ---------- */
// Ping front ≈ 30s ⇒ on tolère 75s avant timeout de la session.
const TIMEOUT_MS = 75_000;

/* ---------- Utils ---------- */
async function closeActiveSession(pres, endAt, reason = "") {
  if (!pres.activeSession) {
    pres.sessionStartAt = null;
    return;
  }

  const sess = await PresenceSession.findById(pres.activeSession).exec();
  if (!sess || sess.endedAt) {
    pres.activeSession = null;
    pres.sessionStartAt = null;
    return;
  }

  const startedAt = sess.startedAt || pres.sessionStartAt || endAt;
  const started = new Date(startedAt);
  const ended = new Date(endAt);

  const duration = Math.max(0, ended.getTime() - started.getTime());

  sess.endedAt = ended;
  sess.lastSeenAt = ended;
  sess.durationMs = duration;
  sess.endReason = reason || "";
  sess.status = "offline";
  await sess.save();

  pres.activeSession = null;
  pres.sessionStartAt = null;
}

async function openNewSession(userId, pres, now, req, methodFromBody = "") {
  // Fermer une éventuelle session résiduelle (sécurité)
  if (pres.activeSession) {
    await closeActiveSession(pres, now, "overlap_guard");
  }

  // Enrichissements
  const ua = String(req.headers["user-agent"] || "");
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  // Email (utile pour audits)
  const u = await User.findById(userId).lean();
  const email = u?.email || "";

  const sess = await PresenceSession.create({
    user: userId,
    status: "online",
    startedAt: now,
    lastSeenAt: now,
    email,
    method: methodFromBody || "",
    success: true,
    ipHash,
    ua,
  });

  pres.activeSession = sess._id;
  pres.sessionStartAt = now;
}

/* ============================================================================
 * POST /api/presence/heartbeat
 * body: { kind?: "online" | "heartbeat" | "away" | "offline", at?: number, method?: string }
 * - "method" (optionnel) : n'est pris en compte qu'à l'ouverture de session
 * ============================================================================ */
router.post("/heartbeat", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const kind = String(req.body?.kind || "heartbeat");
    const methodOnce = typeof req.body?.method === "string" ? req.body.method : "";
    const nowMs = Number(req.body?.at) > 0 ? Number(req.body.at) : Date.now();
    const now = new Date(nowMs);

    // Charger / créer la présence
    let p = await Presence.findOne({ user: userId }).exec();
    if (!p) {
      p = await Presence.create({
        user: userId,
        status: "offline",
        lastPingAt: now,
        sessionStartAt: null,
        lastOnlineAt: null,
        totalOnlineMs: 0,
        activeSession: null,
      });
    }

    const wasActive = p.status === "online" || p.status === "away";

    // 1) Comptabiliser le delta depuis le dernier ping si on était actif
    if (wasActive && p.lastPingAt) {
      const delta = now.getTime() - new Date(p.lastPingAt).getTime();
      if (delta > 0 && delta < 10 * TIMEOUT_MS) {
        p.totalOnlineMs = (p.totalOnlineMs || 0) + delta;
      }
    }

    // 2) Timeout auto ? (onglet fermé / appli tuée)
    const sinceLast = p.lastPingAt ? now.getTime() - new Date(p.lastPingAt).getTime() : Infinity;
    if (wasActive && sinceLast > TIMEOUT_MS) {
      // Clôturer à la dernière trace connue
      await closeActiveSession(p, new Date(p.lastPingAt), "timeout");
      p.status = "offline";
      p.sessionStartAt = null;
    }

    // 2.1) Si session active, mettre à jour son "lastSeenAt"
    if (p.activeSession) {
      await PresenceSession.findByIdAndUpdate(
        p.activeSession,
        { $set: { lastSeenAt: now, status: "online" } },
        { new: false }
      ).exec();
    }

    // 3) Déterminer le prochain statut
    let nextStatus = p.status;
    if (kind === "offline") nextStatus = "offline";
    else if (kind === "away") nextStatus = "away";
    else nextStatus = "online"; // "online" ou "heartbeat" ⇒ online

    // 4) Ouvrir/fermer session selon la transition
    if (p.status === "offline" && (nextStatus === "online" || nextStatus === "away")) {
      // nouvelle session (méthode prise ici si fournie)
      await openNewSession(userId, p, now, req, methodOnce);
    }

    if ((p.status === "online" || p.status === "away") && nextStatus === "offline") {
      await closeActiveSession(p, now, kind === "offline" ? "logout" : "offline");
    }

    // 5) Si session déjà ouverte & on reçoit une "method" non vide, hydrate si manquante
    if (p.activeSession && methodOnce) {
      const sess = await PresenceSession.findById(p.activeSession).exec();
      if (sess && !sess.method) {
        sess.method = methodOnce;
        await sess.save();
      }
    }

    // 6) Finaliser la présence
    p.status = nextStatus;
    p.lastPingAt = now;
    if (nextStatus === "online" || nextStatus === "away") {
      p.lastOnlineAt = now;
    }

    await p.save();

    return ok(res, {
      status: p.status,
      lastPingAt: p.lastPingAt,
      sessionStartAt: p.sessionStartAt,
      lastOnlineAt: p.lastOnlineAt,
      totalOnlineMs: p.totalOnlineMs,
      activeSession: p.activeSession,
    });
  } catch (e) {
    console.error("POST /presence/heartbeat:", e?.message || e);
    return fail(res, "PRESENCE_HEARTBEAT_FAIL");
  }
});

/* ============================================================================
 * GET /api/presence/sessions?limit=20
 * Historique des sessions (online/offline) de l’utilisateur courant
 * ============================================================================ */
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const items = await PresenceSession.find({ user: userId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    return ok(res, {
      items: items.map((s) => ({
        id: String(s._id),
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        endedAt: s.endedAt,
        durationMs: s.durationMs,
        endReason: s.endReason || "",
        status: s.status || "offline",
        // enrichissements "ex-login history"
        email: s.email || "",
        method: s.method || "",
        success: s.success !== false,
        ipHash: s.ipHash || "",
        ua: s.ua || "",
      })),
    });
  } catch (e) {
    console.error("GET /presence/sessions:", e?.message || e);
    return fail(res, "PRESENCE_SESSIONS_FAIL");
  }
});

/* ============================================================================
 * SWEEPER: force l'OFFLINE si aucun ping depuis > TIMEOUT_MS
 * - passe Presence.status = 'offline'
 * - ferme la session active avec endReason "timeout_sweeper"
 * ============================================================================ */
async function presenceSweeperTick() {
  try {
    const cutoff = new Date(Date.now() - TIMEOUT_MS);

    // On ne lit que les personnes marquées actives dont le dernier ping est vieux
    const stale = await Presence.find({
      status: { $in: ["online", "away"] },
      lastPingAt: { $lt: cutoff },
    }).exec();

    for (const p of stale) {
      // clôture à la dernière trace connue
      const endAt = p.lastPingAt ? new Date(p.lastPingAt) : new Date();
      await closeActiveSession(p, endAt, "timeout_sweeper");

      p.status = "offline";
      p.sessionStartAt = null;
      await p.save();
    }
  } catch (e) {
    console.error("[presenceSweeperTick]", e?.message || e);
  }
}

// active le sweeper toutes les 60s (désactivable via env si besoin)
if (process.env.PRESENCE_SWEEPER_ENABLED !== "0") {
  setInterval(presenceSweeperTick, 60_000);
}

module.exports = router;