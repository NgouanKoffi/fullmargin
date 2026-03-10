const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

/**
 * On lance un Mongo en mémoire et on injecte une MONGO_URI fictive pour les tests.
 * Assure-toi que ton src/config/env.js ne fait PAS process.exit(1) en NODE_ENV='test'
 * (ou qu'il accepte une MONGO_URI depuis process.env).
 */

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});