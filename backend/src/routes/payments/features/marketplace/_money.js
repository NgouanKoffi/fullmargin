const toCents = (usd) => Math.round(Number(usd || 0) * 100);
const centsToUnit = (n) => (typeof n === "number" ? Math.round(n) / 100 : 0);

module.exports = { toCents, centsToUnit };
