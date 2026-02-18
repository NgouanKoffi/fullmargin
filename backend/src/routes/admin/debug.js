// backend/src/routes/admin/debug.js
const express = require("express");
const router = express.Router();
const User = require("../../models/user.model");

router.get("/email-counts", async (req, res) => {
  try {
    const total = await User.countDocuments({});
    const withEmail = await User.countDocuments({ email: { $ne: null } });
    const distinctEmails = await User.distinct("email", {
      email: { $ne: null },
    });

    res.json({
      totalUsers: total,
      usersWithEmail: withEmail,
      uniqueEmails: distinctEmails.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;
