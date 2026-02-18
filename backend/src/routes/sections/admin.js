// backend/src/routes/sections/admin.js
module.exports = function adminSection(router) {
  // analytics admin
  try {
    router.use("/analytics/admin", require("../admin/analytics"));
  } catch (e) {
    console.error("Failed to mount /analytics/admin routes:", e?.message || e);
  }

  // analytics public
  try {
    router.use("/analytics", require("../../analytics/routes"));
  } catch (e) {
    console.error("Failed to mount /analytics routes:", e?.message || e);
  }

  // admin users
  try {
    router.use("/admin/users", require("../admin/users"));
  } catch (e) {
    console.error("Failed to mount /admin/users routes:", e?.message || e);
  }

  // 🔍 admin debug
  try {
    router.use("/admin/debug", require("../admin/debug"));
  } catch (e) {
    console.error("Failed to mount /admin/debug routes:", e?.message || e);
  }

  // admin services
  try {
    router.use("/admin/services", require("../admin/services"));
  } catch (e) {
    console.error("Failed to mount /admin/services routes:", e?.message || e);
  }

  // admin service-memberships
  try {
    router.use(
      "/admin/service-memberships",
      require("../admin/serviceMembership.routes"),
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/service-memberships routes:",
      e?.message || e,
    );
  }

  // admin mail
  try {
    router.use("/admin/mail", require("../admin/mail.routes"));
  } catch (e) {
    console.error("Failed to mount /admin/mail routes:", e?.message || e);
  }

  // admin mailbox
  try {
    const mailboxRoutes = require("../admin/mailbox");
    router.use("/admin/mailbox", mailboxRoutes.router || mailboxRoutes);
  } catch (e) {
    console.error("Failed to mount /admin/mailbox routes:", e?.message || e);
  }

  // admin diffusions
  try {
    router.use("/admin/diffusions", require("../admin/diffusions"));
  } catch (e) {
    console.error("Failed to mount /admin/diffusions routes:", e?.message || e);
  }

  // admin mailer broadcasts
  try {
    const broadcasts = require("../admin/mailer.broadcasts");
    router.use("/admin/mailer/broadcasts", broadcasts.router || broadcasts);
  } catch (e) {
    console.error(
      "Failed to mount /admin/mailer/broadcasts routes:",
      e?.message || e,
    );
  }

  // ✅ NEW: admin marketplace orders (orders collection)
  try {
    router.use(
      "/admin/marketplace/orders",
      require("../admin/marketplace.orders"),
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/orders routes:",
      e?.message || e,
    );
  }
};
