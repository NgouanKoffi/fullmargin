// backend/src/routes/communaute/lives.js
const express = require("express");
const router = express.Router();

require("./lives/startNow")(router);
require("./lives/schedule")(router);
require("./lives/update")(router);
require("./lives/cancel")(router);
require("./lives/goLive")(router);
require("./lives/end")(router);

// ✅ NEW : On remplace jitsiToken par livekitToken
require("./lives/livekitToken")(router);
require("./lives/livekitActions")(router);

require("./lives/byCommunity")(router);
require("./lives/publicLive")(router);
require("./lives/myLives")(router);
require("./lives/getOne")(router);

module.exports = router;