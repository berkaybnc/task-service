const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const nock = require("nock");
const app = require("../server.js");

test("Integration: Forwarding Authorization header to Task Service", async () => {
  const token = "Bearer mock-token";
  
  // Mock the task-service response
  const scope = nock("http://127.0.0.1:8080")
    .post("/tasks", (body) => body.title === "Test Task")
    .matchHeader("authorization", token)
    .reply(201, { id: 1, title: "Test Task" });

  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", token)
    .send({ title: "Test Task" })
    .expect(201);

  assert.equal(res.body.id, 1);
  assert.ok(scope.isDone(), "Authorization header was not forwarded correctly");
});

test("Integration: Forwarding Authorization header to Auth Service (Teams)", async () => {
  const token = "Bearer mock-token";
  
  // Mock the auth-service response
  const scope = nock("http://127.0.0.1:3001")
    .post("/teams", (body) => body.name === "Test Team")
    .matchHeader("authorization", token)
    .reply(201, { id: 1, name: "Test Team" });

  const res = await request(app)
    .post("/api/teams")
    .set("Authorization", token)
    .send({ name: "Test Team" })
    .expect(201);

  assert.equal(res.body.name, "Test Team");
  assert.ok(scope.isDone(), "Authorization header was not forwarded to auth-service");
});

test("Integration: Correctly handles /api prefix", async () => {
  // Mock the task-service response for GET /tasks
  const scope = nock("http://127.0.0.1:8080")
    .get("/tasks")
    .reply(200, [{ id: 1, title: "Task 1" }]);

  const res = await request(app)
    .get("/api/tasks")
    .expect(200);

  assert.equal(res.body[0].title, "Task 1");
  assert.ok(scope.isDone(), "Route /api/tasks did not correctly forward to task-service /tasks");
});
