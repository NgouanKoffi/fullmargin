// backend/src/routes/communaute/posts.js
const express = require("express");
const router = express.Router();

// 👇 on récupère tout ce qui est commun (multer, sharp, modèles, middlewares…)
const {
  upload,
  requireAuth,
  optionalAuth,
  ensurePostWriteAccess,
} = require("./posts/_shared");

// 👇 handlers
const createPost = require("./posts/createPost");
const listPosts = require("./posts/listPosts");
const listMyPosts = require("./posts/listMyPosts");
const patchPost = require("./posts/patchPost");
const updatePostMedia = require("./posts/updatePostMedia");
const getPostById = require("./posts/getPostById");
const deletePost = require("./posts/deletePost");
const { likePost, unlikePost } = require("./posts/likes");

// =========================================================
//   ROUTES
// =========================================================

// créer un post
router.post("/", requireAuth, upload.array("media", 5), createPost);

// lister les posts (fil d’actus)
router.get("/", optionalAuth, listPosts);

// mes posts à moi
router.get("/mine", requireAuth, listMyPosts);

// modifier le contenu / la programmation
router.patch("/:id", requireAuth, ensurePostWriteAccess, patchPost);

// modifier les médias d’un post
router.put(
  "/:id/media",
  requireAuth,
  ensurePostWriteAccess,
  upload.array("media", 5),
  updatePostMedia
);

// lire un post (même supprimé)
router.get("/:id", optionalAuth, getPostById);

// supprimer (soft delete)
router.delete("/:id", requireAuth, ensurePostWriteAccess, deletePost);

// likes
router.post("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);

module.exports = router;
