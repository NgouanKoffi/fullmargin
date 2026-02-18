// routes/auth/index.js
const express = require("express");

const googleRoutes   = require("./google");
const registerRoutes = require("./register");
const loginRoutes    = require("./login");
const meRoutes       = require("./me");
const passwordRoutes = require("./password"); // déjà présent
const twoFARoutes    = require("./2fa");      // 👈 AJOUT

const router = express.Router();

// /api/auth/google[/*]
router.use("/google", googleRoutes);

// /api/auth/register/*
router.use("/register", registerRoutes);

// /api/auth/login/*
router.use("/login", loginRoutes);

// /api/auth/password/*   (update / reset de mot de passe)
router.use("/password", passwordRoutes);

// /api/auth/2fa/*   👈 AJOUT (toggle 2FA)
router.use("/2fa", twoFARoutes);

// /api/auth/me, /api/auth/logins
router.use("/", meRoutes);

module.exports = router;