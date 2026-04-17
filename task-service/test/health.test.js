import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../index.js";

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health").expect(200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.service, "task-service");
  assert.ok(typeof res.body.time === "string");
});
