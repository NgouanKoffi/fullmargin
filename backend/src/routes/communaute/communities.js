// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\communities.js
const express = require("express");
const router = express.Router();

require("./communauties/create")(router);
require("./communauties/update")(router);
require("./communauties/check")(router);
require("./communauties/list")(router);
require("./communauties/read")(router);
require("./communauties/categories")(router); // 👈 ICI
require("./communauties/ratings")(router);
require("./communauties/settings")(router);
require("./communauties/mine")(router);

module.exports = router;
