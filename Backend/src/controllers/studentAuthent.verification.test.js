const assert = require("node:assert/strict");
const test = require("node:test");
const Student = require("../models/student");
const redisClient = require("../config/redis");

const controllerPath = require.resolve("./studentAuthent");
const emailPath = require.resolve("../utils/sendEmail");

const withControllerMocks = async (run) => {
  const originalEnv = {
    jwtKey: process.env.JWT_KEY,
    frontendUrl: process.env.FRONTEND_URL,
  };
  const originalFindOne = Student.findOne;
  const originalCreate = Student.create;
  const originalRedisSet = redisClient.set;
  const originalSendEmail = require(emailPath);
  const redisWrites = [];
  const emails = [];
  const user = {
    _id: { toString: () => "user-123" },
    firstName: "Test",
    email: "test@example.com",
    role: "student",
    isEmailVerified: false,
  };

  process.env.JWT_KEY = "verification-test-key";
  process.env.FRONTEND_URL = "https://lectureiq.example.test";
  Student.findOne = async () => null;
  Student.create = async () => user;
  redisClient.set = async (...args) => redisWrites.push(args);
  require.cache[emailPath].exports = async (...args) => emails.push(args);
  delete require.cache[controllerPath];
  const auth = require("./studentAuthent");

  try {
    await run({ auth, user, redisWrites, emails });
  } finally {
    Student.findOne = originalFindOne;
    Student.create = originalCreate;
    redisClient.set = originalRedisSet;
    require.cache[emailPath].exports = originalSendEmail;
    delete require.cache[controllerPath];
    if (originalEnv.jwtKey === undefined) delete process.env.JWT_KEY;
    else process.env.JWT_KEY = originalEnv.jwtKey;
    if (originalEnv.frontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalEnv.frontendUrl;
  }
};

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

const registrationBody = {
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  password: "StrongPass1!",
};

const assertVerificationWasPersisted = ({ redisWrites, emails, user }) => {
  assert.equal(redisWrites.length, 1);
  const [key, userId, options] = redisWrites[0];
  assert.match(key, /^email_verify:/);
  assert.equal(userId, user._id.toString());
  assert.equal(options.EX, 60 * 60 * 24);
  assert.equal(emails.length, 1);
  assert.ok(
    emails[0][2].includes(
      `https://lectureiq.example.test/verify-email?token=${key.slice("email_verify:".length)}`
    )
  );
};

test("persists initial student verification tokens for the frontend flow", async () => {
  await withControllerMocks(async (context) => {
    const response = createResponse();
    await context.auth.register({ body: registrationBody }, response);

    assert.equal(response.statusCode, 201);
    assertVerificationWasPersisted(context);
  });
});

test("persists initial admin verification tokens for the frontend flow", async () => {
  await withControllerMocks(async (context) => {
    const admin = { ...context.user, role: "admin" };
    Student.create = async () => admin;
    const response = createResponse();
    await context.auth.adminRegister({ body: registrationBody }, response);

    assert.equal(response.statusCode, 201);
    assertVerificationWasPersisted({ ...context, user: admin });
  });
});

test("resends a persisted verification token with the frontend verification URL", async () => {
  await withControllerMocks(async (context) => {
    Student.findOne = async () => context.user;
    const response = createResponse();
    await context.auth.resendVerification(
      { body: { email: context.user.email } },
      response
    );

    assert.equal(response.statusCode, 200);
    assertVerificationWasPersisted(context);
  });
});
