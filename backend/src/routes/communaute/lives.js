const express = require("express");
const router = express.Router();

require("./lives/startNow")(router);
require("./lives/schedule")(router);
require("./lives/update")(router);
require("./lives/cancel")(router);
require("./lives/goLive")(router);
require("./lives/end")(router);

// ✅ NEW
require("./lives/jitsiToken")(router);

require("./lives/byCommunity")(router);
require("./lives/publicLive")(router);
require("./lives/getOne")(router);

module.exports = router;
