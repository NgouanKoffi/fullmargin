// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\courses.js
const express = require("express");
const router = express.Router();

// Sous-modules (montage des routes)
require("./courses/list")(router);
require("./courses/create")(router);
require("./courses/public-read")(router);
require("./courses/read")(router);
require("./courses/update")(router);
require("./courses/delete")(router);
require("./courses/enroll")(router);
require("./courses/reviews")(router);
require("./courses/checkout")(router);
require("./courses/pdf")(router);
require("./courses/me-enrollments")(router);

// 🔹 nouveau module admin
require("./courses/admin-enroll")(router);

module.exports = router;
