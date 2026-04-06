const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server.js");

test("POST /auth/login returns a JWT for valid credentials", async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({ username: "admin", password: "admin123" })
    .expect(200);
  assert.ok(typeof res.body.token === "string" && res.body.token.length > 0);
  assert.equal(res.body.user.username, "admin");
});
