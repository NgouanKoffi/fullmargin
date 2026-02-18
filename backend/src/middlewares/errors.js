const { NODE_ENV } = require("../config/env");

function notFound(req, res, next) {
  res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, next) {
  // Log en dev uniquement (pas en prod ni en test)
  if (NODE_ENV === "development") {
    console.error(err);
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Server error" : err.message,
  });
}

module.exports = { notFound, errorHandler };