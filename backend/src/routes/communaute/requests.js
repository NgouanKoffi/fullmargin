// backend/src/routes/communaute/requests.js
const express = require("express");
const router = express.Router();

const Community = require("../../models/community.model");
const CommunityMember = require("../../models/communityMember.model");
const CommunityAccessRequest = require("../../models/communityAccessRequest.model");
const Notification = require("../../models/notification.model");
const { verifyAuthHeader } = require("../auth/_helpers");

/* =========================================================
   middlewares
   ========================================================= */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

async function getCommunityOr404(id, res) {
  try {
    const c = await Community.findOne({ _id: id, deletedAt: null }).lean();
    if (!c) {
      res.status(404).json({ ok: false, error: "Communauté introuvable" });
      return null;
    }
    return c;
  } catch {
    res.status(400).json({ ok: false, error: "Requête invalide" });
    return null;
  }
}

/* =========================================================
   petit helper notif
   ========================================================= */
async function createNotif({
  userId,
  kind,
  communityId = null,
  requestId = null,
  payload = {},
}) {
  if (!userId || !kind) return;
  try {
    console.log("🔔 [CREATING NOTIFICATION]", { userId, kind, communityId, requestId, payload });
    await Notification.create({
      userId,
      kind,
      communityId,
      requestId,
      payload,
      seen: false,
    });
    console.log("✅ [NOTIFICATION CREATED]", kind, "for user", userId);
  } catch (e) {
    // on ne fait pas échouer la requête pour une notif
    console.error("❌ [NOTIF] create failed:", e?.message || e);
  }
}

/* =========================================================
   ✅ POST /communaute/requests
   - un user demande à rejoindre une communauté
   - on notifie le propriétaire
   ========================================================= */
router.post("/", requireAuth, async (req, res) => {
  console.log("📥 [REQUEST RECEIVED] POST /communaute/requests");
  const { communityId, note = "" } = req.body || {};
  console.log("📋 [REQUEST DATA]", { communityId, userId: req.auth.userId, note });
  if (!communityId)
    return res.status(400).json({ ok: false, error: "communityId requis" });

  const community = await getCommunityOr404(communityId, res);
  if (!community) return;
  console.log("✅ [COMMUNITY FOUND]", { name: community.name, ownerId: community.ownerId });

  // vérifier qu’il n’est pas déjà membre
  const alreadyMember = await CommunityMember.exists({
    communityId,
    userId: req.auth.userId,
  });
  if (alreadyMember) {
    return res.status(409).json({
      ok: false,
      error: "Déjà membre de cette communauté",
      code: "ALREADY_MEMBER",
    });
  }

  // il y a un index unique (communityId + userId), donc on upsert “soft”
  try {
    const existing = await CommunityAccessRequest.findOne({
      communityId,
      userId: req.auth.userId,
    }).lean();

    let reqDoc;
    if (existing) {
      console.log("♻️ [UPDATING EXISTING REQUEST]", existing._id);
      // on repasse en pending si jamais
      await CommunityAccessRequest.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "pending",
            note: String(note || "").slice(0, 500),
            reason: "",
          },
        }
      );
      reqDoc = { ...existing, status: "pending" };
    } else {
      console.log("➕ [CREATING NEW REQUEST]");
      reqDoc = await CommunityAccessRequest.create({
        communityId,
        userId: req.auth.userId,
        status: "pending",
        note: String(note || "").slice(0, 500),
      });
      console.log("✅ [REQUEST CREATED]", reqDoc._id);
    }

    console.log("🚀 [ABOUT TO CREATE NOTIFICATION]", {
      ownerId: community.ownerId,
      requesterId: req.auth.userId,
    });

    // 🛎 notifier le propriétaire - avec nom du demandeur
    // Récupérer les infos du demandeur
    const User = require("../../models/user.model");
    const requester = await User.findById(req.auth.userId).select("fullName").lean();
    console.log("👤 [REQUESTER INFO]", { fullName: requester?.fullName });
    
    await createNotif({
      userId: community.ownerId,
      kind: "community_request_received",
      communityId: community._id,
      requestId: reqDoc._id,
      payload: {
        fromUserId: req.auth.userId,
        requesterName: requester?.fullName || "Un utilisateur", // 👈 Nom du demandeur
        communityName: community.name,
        communitySlug: community.slug, // 👈 Pour la redirection
      },
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: String(reqDoc._id),
        status: "pending",
      },
    });
  } catch (e) {
    console.error("[REQUESTS] create ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* =========================================================
   GET /communaute/requests/my
   - demandes que MOI j’ai envoyées
   - on renvoie aussi le nombre de pending pour le badge
   ========================================================= */
router.get("/my", requireAuth, async (req, res) => {
  try {
    const rows = await CommunityAccessRequest.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .populate("communityId", "_id name slug coverUrl logoUrl visibility")
      .lean();

    const items = rows.map((r) => ({
      id: String(r._id),
      community: r.communityId
        ? {
            id: String(r.communityId._id),
            name: r.communityId.name,
            slug: r.communityId.slug,
            coverUrl: r.communityId.coverUrl || "",
            logoUrl: r.communityId.logoUrl || "",
            visibility: r.communityId.visibility || "public",
          }
        : null,
      status: r.status,
      note: r.note || "",
      reason: r.reason || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    const pendingCount = rows.filter((r) => r.status === "pending").length;

    return res.json({ ok: true, data: { items, pendingCount } });
  } catch (e) {
    console.error("[REQUESTS] my ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* =========================================================
   ✅ GET /communaute/requests/incoming/:communityId
   - owner only, filtrable
   - renvoie aussi pendingCount pour le badge
   ========================================================= */
router.get("/incoming/:communityId", requireAuth, async (req, res) => {
  const { communityId } = req.params;
  const c = await getCommunityOr404(communityId, res);
  if (!c) return;
  if (String(c.ownerId) !== String(req.auth.userId))
    return res.status(403).json({ ok: false, error: "Interdit" });

  const status = String(req.query.status || "pending");
  const allowed = new Set(["pending", "approved", "rejected"]);
  const find = { communityId };
  if (allowed.has(status)) find.status = status;

  try {
    const rows = await CommunityAccessRequest.find(find)
      .populate("userId", "_id fullName avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = await CommunityAccessRequest.countDocuments({
      communityId,
      status: "pending",
    });

    const items = rows.map((r) => ({
      id: String(r._id),
      user: {
        id: String(r.userId?._id || ""),
        fullName: r.userId?.fullName || "",
        avatarUrl: r.userId?.avatarUrl || "",
      },
      note: r.note || "",
      requestedAt: r.createdAt,
      status: r.status,
    }));

    return res.json({ ok: true, data: { items, pendingCount } });
  } catch (e) {
    console.error("[REQUESTS] incoming ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* =========================================================
   ✅ GET /communaute/requests/counters
   - utile pour la cloche / le badge
   - renvoie:
     - mesPending: nb de demandes que MOI j’ai envoyées et qui sont encore pending
     - ownerPending: nb de demandes reçues sur ma communauté (si j’en ai une) qui sont pending
   ========================================================= */
router.get("/counters", requireAuth, async (req, res) => {
  try {
    // nb de réponses à MES demandes (approved/rejected) que je n’ai pas encore vues
    const myPending = await Notification.countDocuments({
      userId: req.auth.userId,
      kind: {
        $in: ["community_request_approved", "community_request_rejected"],
      },
      seen: false,
    });

    // nb de demandes EN ATTENTE sur ma communauté (owner)
    const myCommunity = await Community.findOne({
      ownerId: req.auth.userId,
      deletedAt: null,
    })
      .select({ _id: 1 })
      .lean();

    let ownerPending = 0;
    if (myCommunity) {
      ownerPending = await CommunityAccessRequest.countDocuments({
        communityId: myCommunity._id,
        status: "pending",
      });
    }

    return res.json({ ok: true, data: { myPending, ownerPending } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

router.post("/mark-seen", requireAuth, async (req, res) => {
  const { requestIds } = req.body || {};
  const baseFilter = {
    userId: req.auth.userId,
    kind: { $in: ["community_request_approved", "community_request_rejected"] },
    seen: false,
  };
  if (Array.isArray(requestIds) && requestIds.length > 0) {
    baseFilter.requestId = { $in: requestIds };
  }
  try {
    await Notification.updateMany(baseFilter, { $set: { seen: true } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Marquage impossible" });
  }
});

/* =========================================================
   POST /communaute/requests/:requestId/approve
   - on notifie le demandeur
   ========================================================= */
router.post("/:requestId/approve", requireAuth, async (req, res) => {
  const { requestId } = req.params;
  try {
    const r = await CommunityAccessRequest.findOne({ _id: requestId }).lean();
    if (!r)
      return res.status(404).json({ ok: false, error: "Demande introuvable" });

    const c = await getCommunityOr404(r.communityId, res);
    if (!c) return;
    if (String(c.ownerId) !== String(req.auth.userId))
      return res.status(403).json({ ok: false, error: "Interdit" });

    if (r.status !== "approved") {
      await CommunityAccessRequest.updateOne(
        { _id: r._id },
        { $set: { status: "approved", reason: "" } }
      );
      const exists = await CommunityMember.exists({
        communityId: r.communityId,
        userId: r.userId,
      });
      if (!exists) {
        await CommunityMember.create({
          communityId: r.communityId,
          userId: r.userId,
        });
        await Community.updateOne(
          { _id: r.communityId },
          { $inc: { membersCount: 1 } }
        );
      }

      // 🛎 notifier le demandeur
      await createNotif({
        userId: r.userId,
        kind: "community_request_approved",
        communityId: r.communityId,
        requestId: r._id,
        payload: {
          communityName: c.name,
          communitySlug: c.slug, // 👈 Pour la redirection
        },
      });
    }
    return res.json({ ok: true, data: { status: "approved" } });
  } catch (e) {
    console.error("[REQUESTS] approve ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
});

/* =========================================================
   POST /communaute/requests/:requestId/reject
   - on notifie le demandeur
   ========================================================= */
router.post("/:requestId/reject", requireAuth, async (req, res) => {
  const { requestId } = req.params;
  const { reason = "" } = req.body || {};
  try {
    const r = await CommunityAccessRequest.findOne({ _id: requestId }).lean();
    if (!r)
      return res.status(404).json({ ok: false, error: "Demande introuvable" });

    const c = await getCommunityOr404(r.communityId, res);
    if (!c) return;
    if (String(c.ownerId) !== String(req.auth.userId))
      return res.status(403).json({ ok: false, error: "Interdit" });

    if (r.status !== "rejected") {
      await CommunityAccessRequest.updateOne(
        { _id: r._id },
        {
          $set: {
            status: "rejected",
            reason: String(reason || "").slice(0, 500),
          },
        }
      );

      // 🛎 notifier le demandeur
      await createNotif({
        userId: r.userId,
        kind: "community_request_rejected",
        communityId: r.communityId,
        requestId: r._id,
        payload: {
          communityName: c.name,
          communitySlug: c.slug, // 👈 Pour la redirection
          reason: String(reason || ""),
        },
      });
    }
    return res.json({ ok: true, data: { status: "rejected" } });
  } catch (e) {
    console.error("[REQUESTS] reject ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
});

module.exports = router;
