const crypto = require("crypto");

function verifyWordPressPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string")
    return false;
  if (!storedHash.startsWith("$P$")) return false;

  const itoa64 =
    "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const countLog2 = itoa64.indexOf(storedHash[3]);
  if (countLog2 < 7 || countLog2 > 30) return false;

  const count = 1 << countLog2;
  const salt = storedHash.substring(4, 12);

  let hash = crypto
    .createHash("md5")
    .update(salt + password)
    .digest();
  for (let i = 0; i < count; i++) {
    hash = crypto
      .createHash("md5")
      .update(Buffer.concat([hash, Buffer.from(password)]))
      .digest();
  }

  const output = encode64(hash, 16, itoa64);
  return storedHash === "$P$" + storedHash[3] + salt + output;
}

function encode64(input, count, itoa64) {
  let output = "";
  let i = 0;
  do {
    let value = input[i++];
    output += itoa64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    output += itoa64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    output += itoa64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    output += itoa64[(value >> 18) & 0x3f];
  } while (i < count);
  return output;
}

module.exports = { verifyWordPressPassword };
