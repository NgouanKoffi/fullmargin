const express = require("express");
const router = express.Router();
const Community = require("../../models/community.model");
const User = require("../../models/user.model");
const { createNotif } = require("../../utils/notifications");
const {
  sendCommunityDeletionApprovedEmail,
  sendCommunityWarningEmail,
  sendCommunityDeletedDueToWarningsEmail,
} = require("../../utils/mailer");

router.get("/", async (req, res) => {
  try {
    const q = { deletedAt: null };
    if (req.query.status === "deletion_requested") {
      q.status = "deletion_requested";
      delete q.deletedAt;
    }
    const rawItems = await Community.find(q).sort({ createdAt: -1 }).lean();
    const items = rawItems.map((item) => ({
      ...item,
      id: String(item._id),
    }));
    res.json({ ok: true, data: { items } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post("/:id/approve-deletion", async (req, res) => {
  try {
    const c = await Community.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

    c.status = "deleted_by_admin";
    c.deletedAt = new Date();
    await c.save();

    await createNotif({
      userId: c.ownerId,
      kind: "community_deleted",
      communityId: c._id,
      payload: { name: c.name }
    });

    // 📧 Email au propriétaire
    try {
      const owner = await User.findById(c.ownerId).lean();
      if (owner?.email) {
        await sendCommunityDeletionApprovedEmail({
          to: owner.email,
          fullName: owner.fullName,
          communityName: c.name,
        });
      }
    } catch (err) {
      console.error("[ADMIN COMMUNITIES] Email approve-deletion error:", err);
    }

    res.json({ ok: true, message: "Suppression approuvée." });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post("/:id/approve-restoration", async (req, res) => {
  try {
    const c = await Community.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

    c.status = "active";
    c.deletedAt = null;
    await c.save();

    await createNotif({
      userId: c.ownerId,
      kind: "community_restored",
      communityId: c._id,
      payload: { name: c.name }
    });

    res.json({ ok: true, message: "Restauration approuvée." });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post("/:id/warnings", async (req, res) => {
  try {
    const c = await Community.findOne({ _id: req.params.id, deletedAt: null });
    if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

    const reason = req.body.reason || "Avertissement administrateur";
    
    c.warnings.push({ reason, date: new Date() });
    c.warningCount = c.warnings.length;

    // 📧 Chercher le propriétaire pour l'email
    let owner = null;
    try {
      owner = await User.findById(c.ownerId).lean();
    } catch (err) {
      console.error("[ADMIN COMMUNITIES] User fetch error:", err);
    }

    if (c.warningCount >= 3) {
      c.status = "deleted_by_admin";
      c.deletedAt = new Date();
      c.deletionReason = "Fermeture automatique suite à 3 avertissements.";

      await createNotif({
        userId: c.ownerId,
        kind: "community_deleted_due_to_warnings",
        communityId: c._id,
        payload: { reason }
      });

      // 📧 Email suppression suite avertissements
      if (owner?.email) {
        try {
          await sendCommunityDeletedDueToWarningsEmail({
            to: owner.email,
            fullName: owner.fullName,
            communityName: c.name,
            reason,
          });
        } catch (err) {
          console.error("[ADMIN COMMUNITIES] Email deleted-due-to-warnings error:", err);
        }
      }
    } else {
      await createNotif({
        userId: c.ownerId,
        kind: "warning_issued",
        communityId: c._id,
        payload: { reason, warningCount: c.warningCount }
      });

      // 📧 Email avertissement
      if (owner?.email) {
        try {
          await sendCommunityWarningEmail({
            to: owner.email,
            fullName: owner.fullName,
            communityName: c.name,
            reason,
            warningCount: c.warningCount,
          });
        } catch (err) {
          console.error("[ADMIN COMMUNITIES] Email warning error:", err);
        }
      }
    }

    await c.save();
    return res.json({ ok: true, message: "Avertissement traité." });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
