// backend/src/routes/sections/journal.js
module.exports = function journalSection(router) {
  try {
    router.use("/journal/accounts", require("../journal.accounts"));
  } catch (e) {
    console.error("Failed to mount /journal/accounts routes:", e?.message || e);
  }

  try {
    router.use("/journal/markets", require("../journal.markets"));
  } catch (e) {
    console.error("Failed to mount /journal/markets routes:", e?.message || e);
  }

  try {
    router.use("/journal/strategies", require("../journal.strategies"));
  } catch (e) {
    console.error(
      "Failed to mount /journal/strategies routes:",
      e?.message || e
    );
  }

  try {
    router.use("/journal/bootstrap", require("../journal.bootstrap"));
  } catch (e) {
    console.error(
      "Failed to mount /journal/bootstrap routes:",
      e?.message || e
    );
  }

  // enfin la grosse route
  try {
    router.use("/journal", require("../journal"));
  } catch (e) {
    console.error("Failed to mount /journal routes:", e?.message || e);
  }
};
