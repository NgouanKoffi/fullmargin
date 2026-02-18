// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\complaints.js
const express = require("express");
const router = express.Router();

const Community = require("../../models/community.model");
const CommunityComplaint = require("../../models/communityComplaint.model");
const { verifyAuthHeader } = require("../auth/_helpers");

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
   POST /communaute/complaints
   Body: { communityId, subjectType?, subjectId?, category?, message }
----------------------------------------------------------*/
router.post("/", requireAuth, async (req, res) => {
  const {
    communityId,
    subjectType = "other",
    subjectId = "",
    category = "other",
    message = "",
  } = req.body || {};
  if (!communityId)
    return res.status(400).json({ ok: false, error: "communityId requis" });

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;

  try {
    const doc = await CommunityComplaint.create({
      communityId,
      userId: req.auth.userId,
      subjectType,
      subjectId: String(subjectId).slice(0, 200),
      category,
      message: String(message).slice(0, 2000),
      status: "pending",
    });
    return res.json({ ok: true, data: { id: String(doc._id) } });
  } catch (e) {
    console.error("[COMPLAINTS] create ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'enregistrer la plainte" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/complaints/my
   Mes plaintes
----------------------------------------------------------*/
router.get("/my", requireAuth, async (req, res) => {
  try {
    const rows = await CommunityComplaint.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .populate("communityId", "_id name slug")
      .lean();

    const items = rows.map((r) => ({
      id: String(r._id),
      community: r.communityId
        ? {
            id: String(r.communityId._id),
            name: r.communityId.name,
            slug: r.communityId.slug,
          }
        : null,
      subjectType: r.subjectType,
      subjectId: r.subjectId || "",
      category: r.category,
      message: r.message || "",
      status: r.status,
      resolutionNote: r.resolutionNote || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[COMPLAINTS] my ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/complaints/incoming/:communityId
   Proprio: plaintes reçues (toutes ou filtrées par status)
----------------------------------------------------------*/
router.get("/incoming/:communityId", requireAuth, async (req, res) => {
  const { communityId } = req.params;
  const { status } = req.query; // optional

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;
  if (String(c.ownerId) !== String(req.auth.userId))
    return res.status(403).json({ ok: false, error: "Interdit" });

  try {
    const q = { communityId };
    if (status) q.status = status;
    const rows = await CommunityComplaint.find(q)
      .sort({ createdAt: -1 })
      .populate("userId", "_id fullName avatarUrl")
      .lean();

    const items = rows.map((r) => ({
      id: String(r._id),
      user: r.userId
        ? {
            id: String(r.userId._id),
            fullName: r.userId.fullName || "",
            avatarUrl: r.userId.avatarUrl || "",
          }
        : null,
      subjectType: r.subjectType,
      subjectId: r.subjectId || "",
      category: r.category,
      message: r.message || "",
      status: r.status,
      resolutionNote: r.resolutionNote || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[COMPLAINTS] incoming ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   POST /communaute/complaints/:id/transition
   Owner: changer le statut (in_review | resolved | rejected)
   Body: { status, note? }
----------------------------------------------------------*/
router.post("/:id/transition", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, note = "" } = req.body || {};
  if (!["in_review", "resolved", "rejected"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Statut invalide" });
  }

  try {
    const r = await CommunityComplaint.findOne({ _id: id }).lean();
    if (!r)
      return res.status(404).json({ ok: false, error: "Plainte introuvable" });

    const c = await getCommunityOr404(r.communityId, res);
    if (!c) return;
    if (String(c.ownerId) !== String(req.auth.userId))
      return res.status(403).json({ ok: false, error: "Interdit" });

    await CommunityComplaint.updateOne(
      { _id: id },
      {
        $set: {
          status,
          resolutionNote: String(note).slice(0, 2000),
          handledBy: req.auth.userId,
        },
      }
    );

    return res.json({ ok: true, data: { status } });
  } catch (e) {
    console.error("[COMPLAINTS] transition ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
});

module.exports = router;
