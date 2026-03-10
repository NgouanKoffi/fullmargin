// backend/src/routes/communaute/groups/index.js
const express = require("express");
const router = express.Router();

require("./groups/list")(router);
require("./groups/create")(router);
require("./groups/update")(router);
require("./groups/remove")(router);
require("./groups/public")(router);
require("./groups/membership")(router);
require("./groups/join")(router);
require("./groups/leave")(router);
require("./groups/admin-members")(router);

module.exports = router;
