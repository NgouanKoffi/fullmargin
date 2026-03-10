// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\index.js
const express = require("express");
const router = express.Router();

// ordre global
require("./sections/core")(router);
require("./sections/comments-inline")(router);
require("./sections/auth-and-profile")(router);
require("./sections/productivity")(router);
require("./sections/journal")(router);
require("./sections/admin")(router);
require("./sections/podcasts")(router);
require("./sections/marketplace")(router);
require("./sections/communaute")(router);
require("./sections/payments")(router);
require("./sections/notifications")(router);

// ✅ AJOUTER CETTE LIGNE
require("./sections/finance")(router);

module.exports = router;
