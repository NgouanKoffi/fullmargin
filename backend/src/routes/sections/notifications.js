// backend/src/routes/sections/notifications.js
module.exports = function notificationsSection(router) {
  try {
    router.use("/notifications", require("../notifications"));
  } catch (e) {
    console.error("Failed to mount /notifications routes:", e?.message || e);
  }
};
