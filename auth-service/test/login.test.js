const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// server.js'i önce yükle → Mongoose şemaları register edilir
const app = require("../server.js");

test("POST /auth/login returns a JWT for valid credentials", async (t) => {
  // Pre-hash "admin123" so we can return it from the mock
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Fake admin user döndürecek mock
  const fakeUser = {
    _id: new mongoose.Types.ObjectId(),
    username: "admin",
    passwordHash: hashedPassword,
    role: "admin",
    firstName: "Admin",
  };

  // User.findOne'u geçici olarak patch'le
  const UserModel = mongoose.model("User");
  const original = UserModel.findOne.bind(UserModel);
  t.after(() => { UserModel.findOne = original; });
  UserModel.findOne = async () => fakeUser;

  const res = await request(app)
    .post("/auth/login")
    .send({ username: "admin", password: "admin123" })
    .expect(200);

  assert.ok(typeof res.body.token === "string" && res.body.token.length > 0);
  assert.equal(res.body.user.username, "admin");
});

test("POST /auth/login returns 401 for invalid credentials", async (t) => {
  const UserModel = mongoose.model("User");
  const original = UserModel.findOne.bind(UserModel);
  t.after(() => { UserModel.findOne = original; });
  UserModel.findOne = async () => null;

  await request(app)
    .post("/auth/login")
    .send({ username: "nonexistent", password: "wrong" })
    .expect(401);
});
