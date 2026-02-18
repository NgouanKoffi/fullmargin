const request = require("supertest");
const app = require("../src/app");

describe("Health endpoints", () => {
  it("GET /health -> { ok: true }", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  it("GET /api/health -> { ok: true }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  it("GET /404 -> 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.statusCode).toBe(404);
  });
});