const { doSendNow } = require("../routes/admin/mailer.broadcasts");
const MailBroadcast = require("../models/mailBroadcast.model");

async function tick() {
  const now = new Date();
  const docs = await MailBroadcast.find({
    status: "scheduled",
    sendAt: { $lte: now },
  }, { _id: 1 }).lean();

  for (const d of docs) {
    try { await doSendNow(d._id); }
    catch (e) { /* le status est mis à failed dans doSendNow */ }
  }
}

function startScheduler() {
  setInterval(tick, 30_000); // toutes les 30s
  // tick au boot
  tick().catch(()=>{});
}

module.exports = { startScheduler };