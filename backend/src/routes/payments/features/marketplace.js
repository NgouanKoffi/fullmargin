// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\marketplace.js
// IMPORTANT: ne pas faire require("./marketplace") ici (circular require)
// car ce fichier s'appelle marketplace.js et Node va se re-requérir lui-même.
module.exports = require("./marketplace/index");
