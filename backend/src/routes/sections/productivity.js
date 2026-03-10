// backend/src/routes/sections/productivity.js
module.exports = function productivitySection(router) {
  // presence
  try {
    router.use("/presence", require("../presence"));
  } catch (e) {
    console.error("Failed to mount /presence routes:", e?.message || e);
  }

  // notes
  try {
    router.use("/notes", require("../notes"));
  } catch (e) {
    console.error("Failed to mount /notes routes:", e?.message || e);
  }

  // folders
  try {
    router.use("/folders", require("../folders"));
  } catch (e) {
    console.error("Failed to mount /folders routes:", e?.message || e);
  }

  // finance
  try {
    router.use("/finance", require("../finance"));
  } catch (e) {
    console.error("Failed to mount /finance routes:", e?.message || e);
  }

  // kanban
  try {
    router.use("/kanban", require("../kanban"));
  } catch (e) {
    console.error("Failed to mount /kanban routes:", e?.message || e);
  }

  // shares
  try {
    router.use("/shares", require("../shares.routes"));
  } catch (e) {
    console.error("Failed to mount /shares routes:", e?.message || e);
  }

  // affiliation
  try {
    router.use("/affiliation", require("../affiliation"));
  } catch (e) {
    console.error("Failed to mount /affiliation routes:", e?.message || e);
  }
};
