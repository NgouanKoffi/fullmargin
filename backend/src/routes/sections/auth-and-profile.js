// backend/src/routes/sections/auth-and-profile.js
module.exports = function authAndProfileSection(router) {
  // /auth
  try {
    router.use("/auth", require("../auth"));
  } catch (e) {
    console.error("Failed to mount /auth routes:", e?.message || e);
  }

  // /profile (nouveau)
  try {
    router.use("/profile", require("../profile"));
  } catch (e) {
    console.error("Failed to mount /profile routes:", e?.message || e);
  }

  // /auth/profile (ancien)
  try {
    router.use("/auth/profile", require("../auth/profile"));
  } catch (e) {
    console.error("Failed to mount /auth/profile routes:", e?.message || e);
  }

  // /users (public)
  try {
    router.use("/users", require("../auth/users.public"));
  } catch (e) {
    console.error("Failed to mount /users public routes:", e?.message || e);
  }

  // SSO FullMetrix
  try {
    const ssoFullMetrix = require("../auth/sso.fullmetrix");
    router.use("/auth/sso", ssoFullMetrix);
  } catch (e) {
    console.error(
      "Failed to mount /auth/sso/fullmetrix route:",
      e?.message || e
    );
  }
};
