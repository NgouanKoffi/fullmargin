// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\profile\index.js
const express = require("express");
const router = express.Router();

// /api/profile/extra (GET & PATCH)
router.use("/extra", require("./extra"));

// /api/profile/avatar + /api/profile/cover
router.use("/", require("./media"));

module.exports = router;
