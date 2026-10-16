const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const test = require("node:test");
const Student = require("../models/student");
const redisClient = require("../config/redis");

const originalJwtKey = process.env.JWT_KEY;
const originalFindById = Student.findById;
const originalRedisExists = redisClient.exists;
const jwtKey = "student-middleware-test-key";
const studentMiddleware = require("./studentMiddleware");
const authMiddleware = require("./authMiddleware");

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const invokeMiddleware = async (middleware, { user, token }) => {
  token ??= jwt.sign({ _id: user?._id || "student-1" }, jwtKey);
  let selectedFields;
  Student.findById = () => ({
    select(fields) {
      selectedFields = fields;
      return Promise.resolve(user);
    },
    then(resolve, reject) {
      return Promise.resolve(user).then(resolve, reject);
    },
  });
  redisClient.exists = async () => 0;
  const req = {
    cookies: { token },
    headers: {},
  };
  const res = createResponse();
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled, selectedFields };
};

test.before(() => {
  process.env.JWT_KEY = jwtKey;
});

test.after(() => {
  Student.findById = originalFindById;
  redisClient.exists = originalRedisExists;
  if (originalJwtKey === undefined) delete process.env.JWT_KEY;
  else process.env.JWT_KEY = originalJwtKey;
});

test("allows an active, verified student without selecting the password hash", async () => {
  const user = {
    _id: "student-1",
    role: "student",
    isEmailVerified: true,
    isActive: true,
  };
  const { req, res, nextCalled, selectedFields } = await invokeMiddleware(
    studentMiddleware,
    { user }
  );

  assert.equal(res.statusCode, null);
  assert.equal(nextCalled, true);
  assert.equal(req.student, user);
  assert.equal(selectedFields, undefined);
});

test("rejects an inactive student on protected routes", async () => {
  const { res, nextCalled } = await invokeMiddleware(studentMiddleware, {
    user: { isEmailVerified: true, isActive: false },
  });

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: "Account inactive" });
  assert.equal(nextCalled, false);
});

test("rejects an unverified student on protected routes", async () => {
  const { res, nextCalled } = await invokeMiddleware(studentMiddleware, {
    user: { isEmailVerified: false, isActive: true },
  });

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: "Email not verified" });
  assert.equal(nextCalled, false);
});

test("rejects a missing student", async () => {
  const { res, nextCalled } = await invokeMiddleware(studentMiddleware, {
    user: null,
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "Unauthorized" });
  assert.equal(nextCalled, false);
});

test("rejects an invalid token", async () => {
  const { res, nextCalled } = await invokeMiddleware(studentMiddleware, {
    user: null,
    token: "not-a-jwt",
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "Unauthorized" });
  assert.equal(nextCalled, false);
});

test("logout middleware still permits inactive and unverified accounts", async () => {
  const user = {
    _id: "student-1",
    isEmailVerified: false,
    isActive: false,
  };
  const { req, res, nextCalled } = await invokeMiddleware(
    studentMiddleware.forLogout,
    { user }
  );

  assert.equal(res.statusCode, null);
  assert.equal(nextCalled, true);
  assert.equal(req.student, user);
});

test("change-password middleware explicitly selects the password hash", async () => {
  const { res, nextCalled, selectedFields } = await invokeMiddleware(
    studentMiddleware.withPassword,
    {
      user: { isEmailVerified: true, isActive: true },
    }
  );

  assert.equal(res.statusCode, null);
  assert.equal(nextCalled, true);
  assert.equal(selectedFields, "+password");
});

test("general auth middleware rejects inactive and unverified accounts", async () => {
  const token = jwt.sign({ _id: "student-1" }, jwtKey);
  for (const user of [
    { isEmailVerified: false, isActive: true },
    { isEmailVerified: true, isActive: false },
  ]) {
    const { res, nextCalled } = await invokeMiddleware(authMiddleware, {
      user,
      token,
    });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  }
});
