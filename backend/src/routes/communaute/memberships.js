// backend/src/routes/communaute/memberships.js
const express = require("express");
const router = express.Router();

const Community = require("../../models/community.model");
const CommunityMember = require("../../models/communityMember.model");
const CommunityAccessRequest = require("../../models/communityAccessRequest.model");
const { verifyAuthHeader } = require("../auth/_helpers");
const { createNotif } = require("../../utils/notifications");
const User = require("../../models/user.model"); // 👈 pour récupérer le nom du membre

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

/* ---------------------------------------------------------
   POST /communaute/memberships/join
----------------------------------------------------------*/
router.post("/join", requireAuth, async (req, res) => {
  const { communityId, note = "" } = req.body || {};
  if (!communityId)
    return res.status(400).json({ ok: false, error: "communityId requis" });

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;

  const isOwner = String(c.ownerId) === String(req.auth.userId);

  try {
    const existing = await CommunityMember.findOne({
      communityId,
      userId: req.auth.userId,
    });

    // public → membre direct
    if (c.visibility === "public" || isOwner) {
      if (existing) {
        const wasLeft = existing.status === "left";
        if (!existing.status || wasLeft) {
          existing.status = "active";
          existing.leftAt = null;
          await existing.save();
          if (wasLeft) {
            await Community.updateOne(
              { _id: communityId },
              { $inc: { membersCount: 1 } }
            );
          }
        }
      } else {
        await CommunityMember.create({
          communityId,
          userId: req.auth.userId,
          status: "active",
        });
        await Community.updateOne(
          { _id: communityId },
          { $inc: { membersCount: 1 } }
        );
      }

      // on marque aussi la request comme approuvée s'il y en avait une
      await CommunityAccessRequest.updateOne(
        { communityId, userId: req.auth.userId },
        { $set: { status: "approved", reason: "" } },
        { upsert: false }
      );

      // 🟣 ICI on met le vrai nom dans la notif
      if (String(c.ownerId) !== String(req.auth.userId)) {
        const me = await User.findOne({ _id: req.auth.userId })
          .select({ fullName: 1 })
          .lean();

        await createNotif({
          userId: c.ownerId,
          kind: "community_member_joined",
          communityId: c._id,
          payload: {
            joinedUserId: req.auth.userId,
            joinedUserName: me?.fullName || "", // 👈 le nom qui s’affiche dans le front
            communityName: c.name,
          },
        });
      }

      return res.json({ ok: true, data: { status: "approved" } });
    }

    // privé → demande
    const reqDoc = await CommunityAccessRequest.findOneAndUpdate(
      { communityId, userId: req.auth.userId },
      {
        $set: {
          status: "pending",
          note: String(note || "").slice(0, 500),
          reason: "",
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    // 🔔 Notifier le propriétaire de la demande d'adhésion
    const requester = await User.findById(req.auth.userId).select("fullName").lean();
    
    await createNotif({
      userId: c.ownerId,
      kind: "community_request_received",
      communityId: c._id,
      requestId: reqDoc._id,
      payload: {
        fromUserId: req.auth.userId,
        requesterName: requester?.fullName || "Un utilisateur",
        communityName: c.name,
        communitySlug: c.slug,
      },
    });

    return res.json({ ok: true, data: { status: reqDoc.status } });
  } catch (e) {
    console.error("[MEMBERSHIPS] join ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de traiter la demande" });
  }
});

/* ---------------------------------------------------------
   POST /communaute/memberships/leave
   👉 ici on corrige : on marque aussi la request comme “left”
----------------------------------------------------------*/
// backend/src/routes/communaute/memberships.js

router.post("/leave", requireAuth, async (req, res) => {
  const { communityId } = req.body || {};
  if (!communityId)
    return res.status(400).json({ ok: false, error: "communityId requis" });

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;

  try {
    const m = await CommunityMember.findOne({
      communityId,
      userId: req.auth.userId,
    });

    if (m && (m.status !== "left" || !m.status)) {
      m.status = "left";
      m.leftAt = new Date();
      await m.save();

      await Community.updateOne(
        { _id: communityId },
        { $inc: { membersCount: -1 } }
      );
    }

    // on passe aussi la request à "left"
    await CommunityAccessRequest.updateOne(
      { communityId, userId: req.auth.userId, status: "approved" },
      {
        $set: {
          status: "left",
          reason: "user left community",
        },
      }
    );

    // ✅ notifier le propriétaire que quelqu’un est parti
    if (String(c.ownerId) !== String(req.auth.userId)) {
      const leaver = await User.findOne({ _id: req.auth.userId })
        .select({ fullName: 1 })
        .lean();

      await createNotif({
        userId: c.ownerId,
        kind: "community_member_left",
        communityId: c._id,
        payload: {
          leftUserId: req.auth.userId,
          leftUserName: leaver?.fullName || "",
          communityName: c.name || "",
        },
      });
    }

    return res.json({ ok: true, data: { status: "none" } });
  } catch (e) {
    console.error("[MEMBERSHIPS] leave ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Impossible de quitter" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/memberships/status/:communityId
----------------------------------------------------------*/
router.get("/status/:communityId", requireAuth, async (req, res) => {
  const { communityId } = req.params;
  try {
    const m = await CommunityMember.findOne({
      communityId,
      userId: req.auth.userId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).lean();
    if (m) return res.json({ ok: true, data: { status: "approved" } });

    const r = await CommunityAccessRequest.findOne({
      communityId,
      userId: req.auth.userId,
    }).lean();
    return res.json({ ok: true, data: { status: r?.status || "none" } });
  } catch {
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/memberships/my
----------------------------------------------------------*/
router.get("/my", requireAuth, async (req, res) => {
  try {
    const rows = await CommunityMember.find({
      userId: req.auth.userId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).lean();
    return res.json({
      ok: true,
      data: { communityIds: rows.map((r) => String(r.communityId)) },
    });
  } catch (e) {
    console.error("[MEMBERSHIPS] my ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/memberships/:communityId/members
   → liste tous les membres actifs avec nom + photo
----------------------------------------------------------*/
router.get("/:communityId/members", requireAuth, async (req, res) => {
  const { communityId } = req.params;

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;

  // 🔐 Ici on limite au propriétaire (tu pourras élargir plus tard)
  const isOwner = String(c.ownerId) === String(req.auth.userId);
  if (!isOwner) {
    return res
      .status(403)
      .json({
        ok: false,
        error: "Accès réservé au propriétaire de la communauté",
      });
  }

  try {
    const members = await CommunityMember.find({
      communityId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    })
      .populate({
        path: "userId",
        select: {
          firstName: 1,
          lastName: 1,
          fullName: 1,
          avatarUrl: 1,
          photoUrl: 1,
        },
      })
      .sort({ createdAt: 1 })
      .lean();

    const data = members
      .map((m) => {
        const u = m.userId;
        if (!u) return null;

        const firstName = u.firstName || "";
        const lastName = u.lastName || "";
        const fullName =
          u.fullName || `${firstName} ${lastName}`.trim() || "Utilisateur";

        const avatarUrl = u.avatarUrl || u.photoUrl || null;

        return {
          id: String(u._id),
          firstName,
          lastName,
          fullName,
          avatarUrl,
        };
      })
      .filter(Boolean);

    return res.json({ ok: true, data });
  } catch (e) {
    console.error("[MEMBERSHIPS] list members ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de lister les membres" });
  }
});

module.exports = router;
