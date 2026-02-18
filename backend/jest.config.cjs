/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    // Dossier des tests
    testMatch: ["<rootDir>/tests/**/*.test.js"],
    // Setup pour Mongo en mémoire + env test
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    // Couverture
    collectCoverageFrom: ["src/**/*.js", "server.js"],
    coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
    // Temps un peu plus long pour spawner Mongo en mémoire la 1ère fois
    testTimeout: 30000
  };
  