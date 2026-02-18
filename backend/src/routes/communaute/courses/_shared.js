// backend/src/routes/communaute/courses/_shared.js
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const { verifyAuthHeader } = require("../../auth/_helpers");

// MODELS
const Community = require("../../../models/community.model");
const CommunityMember = require("../../../models/communityMember.model");
const Course = require("../../../models/course.model");
const CourseEnrollment = require("../../../models/courseEnrollment.model");
const CourseReview = require("../../../models/courseReview.model");
const User = require("../../../models/user.model");

// STORAGE UTILS
const {
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
} = require("../../../utils/storage");

/* ---------- Upload & JSON body ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
    fields: 4000,
    files: 200,
  },
});
const jsonBody = express.json({ limit: "50mb" });

/* ---------- Helpers ---------- */
function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Auth robuste : header Authorization OU query ?token= */
function getAuth(req) {
  try {
    const a = verifyAuthHeader(req);
    if (a && a.userId) return a;
  } catch {}

  const q = String(req.query?.token || "");
  if (q) {
    try {
      const fakeReq = { headers: { authorization: `Bearer ${q}` } };
      const a2 = verifyAuthHeader(fakeReq);
      if (a2 && a2.userId) return a2;
    } catch {}
  }

  return null;
}

function requireAuth(req, res, next) {
  try {
    const a = getAuth(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/** Vérifie que l'utilisateur est bien owner de la communauté */
async function assertCommunityOwner(communityId, userId) {
  if (!communityId) return { ok: false, error: "communityId requis" };

  const c = await Community.findOne({ _id: communityId, deletedAt: null })
    .select({ _id: 1, ownerId: 1 })
    .lean();

  if (!c) return { ok: false, error: "Communauté introuvable" };
  if (String(c.ownerId) !== String(userId))
    return { ok: false, error: "Interdit" };

  return { ok: true, community: c };
}

/** Vérifie inscription au cours */
async function isUserEnrolled(userId, courseId) {
  if (!userId || !courseId) return false;
  const found = await CourseEnrollment.findOne({ userId, courseId })
    .select({ _id: 1 })
    .lean();
  return !!found;
}

/* ---------- Mapping modules / lessons / items ---------- */
function normalizeModules(mods) {
  if (!Array.isArray(mods)) return [];

  return mods.map((m, idx) => ({
    id: String(m.id || `mod_${idx}`),
    title: String(m.title || `Module ${idx + 1}`).trim(),
    description: String(m.description || "").trim(),
    order: Number.isFinite(m.order) ? Number(m.order) : idx,
    lessons: Array.isArray(m.lessons)
      ? m.lessons.map((l, li) => ({
          id: String(l.id || `les_${li}`),
          title: String(l.title || `Leçon ${li + 1}`).trim(),
          description: String(l.description || "").trim(),
          items: Array.isArray(l.items)
            ? l.items.map((it, ii) => {
                const isImage = it.type === "image" || it.subtype === "image";
                const isVideo = it.type === "video" || it.subtype === "video";
                const normalizedType = isImage
                  ? "image"
                  : isVideo
                  ? "video"
                  : "pdf";

                return {
                  id: String(it.id || `it_${ii}`),
                  type: normalizedType,
                  subtype: isImage
                    ? "image"
                    : typeof it.subtype === "string"
                    ? it.subtype
                    : "",
                  title: String(
                    it.title || (normalizedType || "item").toUpperCase()
                  ).trim(),
                  url: String(it.url || ""),
                  publicId: String(it.publicId || ""),
                  durationMin:
                    typeof it.durationMin === "number"
                      ? it.durationMin
                      : undefined,
                  fileKey: it.fileKey ? String(it.fileKey) : undefined,
                };
              })
            : [],
        }))
      : [],
  }));
}

/* ---------- Fetch ---------- */
const doFetch =
  typeof fetch === "function"
    ? fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

module.exports = {
  mongoose,
  upload,
  jsonBody,
  slugify,
  getAuth,
  requireAuth,
  assertCommunityOwner,
  isUserEnrolled,
  normalizeModules,
  doFetch,

  // Models & storage
  Community,
  CommunityMember,
  Course,
  CourseEnrollment,
  CourseReview,
  User,
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
};
