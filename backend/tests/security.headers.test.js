const request = require("supertest");
const app = require("../src/app");

describe("Sécurité – en-têtes & hygiène", () => {
  test("helmet: quelques en-têtes de sécu sont présents", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("mongoSanitize: supprime les clés commençant par $", async () => {
    const res = await request(app)
      .post("/api/debug/echo")
      .send({ user: { $ne: "" }, normal: 1 }); // petit payload !
    expect(res.status).toBe(200);
    expect(res.body.body.user).toEqual({});  // la clé $ne a sauté
    expect(res.body.body.normal).toBe(1);
  });

  test("hpp: déduplique les paramètres multi-occurrence (last wins)", async () => {
    const res = await request(app)
      .post("/api/debug/echo?role=user&role=admin")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.query.role).toBe("admin");
  });

  test("Handler d'erreurs: pas de stack leak (réponse générique)", async () => {
    const res = await request(app).get("/api/debug/boom");
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Server error|Internal/i);
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+.*\(/); // pas de stack
  });
});