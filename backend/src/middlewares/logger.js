// backend/src/middlewares/logger.js
const morgan = require("morgan");
const { NODE_ENV } = require("../config/env");

function applyLogger(app) {
  if (NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }
}

module.exports = { applyLogger };