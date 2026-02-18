// backend/src/routes/payments/features/fmmetrix/index.js
const express = require("express");
const router = express.Router();

const Controller = require("./fmmetrix.controller");
const AdminController = require("./fmmetrix.admin.controller");

// --- ROUTES PUBLIQUES / UTILISATEURS ---
router.post("/checkout/fm-metrix", Controller.checkout);
router.get("/fm-metrix/confirm", Controller.confirm);
router.get("/fm-metrix/access", Controller.getAccess);
router.get("/fm-metrix/history", Controller.getHistory);

// --- ROUTES ADMIN ---
router.get("/admin/fm-metrix/list", AdminController.listAll);

// 👇 LA ROUTE QUI MANQUAIT EST ICI 👇
router.get("/admin/fm-metrix/crypto/pending", AdminController.listPending);

router.post("/admin/fm-metrix/crypto/approve", AdminController.approveCrypto);
router.post("/admin/fm-metrix/crypto/reject", AdminController.rejectCrypto);
router.post("/admin/fm-metrix/grant", AdminController.grantManual);
router.delete("/admin/fm-metrix/access/:userId", AdminController.revoke);

// ✅ IMPORTANT : export direct
module.exports = router;
