// backend/src/routes/communaute/lives/_shared.js
const { verifyAuthHeader } = require("../../auth/_helpers");
const Community = require("../../../models/community.model");
const CommunityMember = require("../../../models/communityMember.model");
const CommunityLive = require("../../../models/communityLive.model");
const User = require("../../../models/user.model");

/* ---------- Auth helper ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = {
      userId: a.userId,
      role: a.role || "user",
      email: a.email || "",
    };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* Vérifie que l’utilisateur est owner de la communauté */
async function assertIsOwner(userId, communityId) {
  const c = await Community.findOne({ _id: communityId, deletedAt: null })
    .select({ ownerId: 1, name: 1 })
    .lean();

  if (!c) {
    return { ok: false, error: "Communauté introuvable." };
  }

  if (String(c.ownerId) !== String(userId)) {
    return {
      ok: false,
      error: "Seul l’administrateur peut gérer les directs.",
    };
  }

  return { ok: true, community: c };
}

/* Vérifie que l’utilisateur peut voir les lives (membre ou owner) */
async function assertCanView(userId, communityId, isPublic) {
  const c = await Community.findOne({ _id: communityId, deletedAt: null })
    .select({ ownerId: 1, name: 1 })
    .lean();

  if (!c) {
    return { ok: false, error: "Communauté introuvable." };
  }

  // Owner : accès total
  if (String(c.ownerId) === String(userId)) {
    return { ok: true, community: c };
  }

  // Live public : n'importe quel utilisateur connecté peut voir
  if (isPublic) {
    return { ok: true, community: c };
  }

  // Sinon : il faut être membre actif de la communauté
  const membership = await CommunityMember.findOne({
    communityId,
    userId,
    $or: [{ status: "active" }, { status: { $exists: false } }],
  }).lean();

  if (!membership) {
    return {
      ok: false,
      error:
        "Tu dois être membre de la communauté pour accéder à ce direct privé.",
    };
  }

  return { ok: true, community: c };
}

/**
 * Helper pour normaliser la réponse live.
 *
 * ⚠️ `currentUserId` est optionnel :
 * - si tu ne le passes pas, le comportement reste comme avant
 * - si tu le passes ET que le live contient un `ownerId`,
 *   alors `isOwner` sera vrai pour l’owner.
 */
function mapLive(l, currentUserId) {
  const live = l && typeof l.toObject === "function" ? l.toObject() : l;

  const communityId = String(live.communityId);
  const ownerId = live.ownerId || live.createdBy || null;

  let isOwner = false;
  if (currentUserId && ownerId) {
    isOwner = String(currentUserId) === String(ownerId);
  }

  return {
    id: String(live._id),
    communityId,
    title: live.title,
    description: live.description || "",
    status: live.status,
    startsAt: live.startsAt ? live.startsAt.toISOString() : null,
    plannedEndAt: live.plannedEndAt ? live.plannedEndAt.toISOString() : null,
    roomName: live.roomName,
    isPublic: !!live.isPublic,
    endedAt: live.endedAt ? live.endedAt.toISOString() : null,
    // 👇 nouveau, sans casser l’existant
    isOwner,
  };
}

/* Auto-clôture des lives dont la fin programmée est dépassée */
async function autoEndExpiredLivesForCommunity(communityId) {
  const now = new Date();

  await CommunityLive.updateMany(
    {
      communityId,
      status: "live",
      plannedEndAt: { $lte: now },
    },
    {
      $set: {
        status: "ended",
        endedAt: now,
      },
    }
  );
}

/**
 * Clôture un live si sa fin programmée est dépassée.
 * Utile quand tu charges un live en DB avant de le renvoyer.
 */
async function autoEndLiveIfExpired(live) {
  if (
    live.status === "live" &&
    live.plannedEndAt &&
    live.plannedEndAt <= new Date()
  ) {
    live.status = "ended";
    live.endedAt = new Date();
    await live.save();
  }
}

module.exports = {
  requireAuth,
  assertIsOwner,
  assertCanView,
  mapLive,
  autoEndExpiredLivesForCommunity,
  autoEndLiveIfExpired,
  Community,
  CommunityLive,
  CommunityMember,
  User,
};
