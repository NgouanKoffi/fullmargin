const crypto = require("crypto");
const bcrypt = require("bcrypt");

function gen6() {
  // 100000..999999
  return String(100000 + crypto.randomInt(900000));
}

async function hashCode(code) {
  return bcrypt.hash(code, 10);
}

async function checkCode(code, codeHash) {
  return bcrypt.compare(code, codeHash);
}

module.exports = { gen6, hashCode, checkCode };