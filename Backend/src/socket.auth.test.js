const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const Student = require("./models/student");
const redisClient = require("./config/redis");
const { authenticateSocket } = require("./socket");

const originalJwtKey = process.env.JWT_KEY;
const originalFindById = Student.findById;
const originalRedisExists = redisClient.exists;
const jwtKey = "socket-auth-regression-test-key";
const user = {
  _id: { toString: () => "user-123" },
  firstName: "Test",
  lastName: "User",
  role: "student",
  isEmailVerified: true,
  isActive: true,
};

test.before(() => {
  process.env.JWT_KEY = jwtKey;
  Student.findById = () => ({ select: async () => user });
  redisClient.exists = async () => 0;
});

test.after(() => {
  Student.findById = originalFindById;
  redisClient.exists = originalRedisExists;
  if (originalJwtKey === undefined) delete process.env.JWT_KEY;
  else process.env.JWT_KEY = originalJwtKey;
});

const socketWithCookie = (cookie) => ({
  handshake: { headers: { cookie } },
});

test("authenticates the HTTP-only token cookie used by HTTP login", async () => {
  const token = jwt.sign({ _id: user._id.toString(), role: "student" }, jwtKey);
  const authenticatedUser = await authenticateSocket(
    socketWithCookie(`other=value; token=${encodeURIComponent(token)}`)
  );

  assert.equal(authenticatedUser, user);
});

test("rejects a missing or invalid token cookie", async () => {
  await assert.rejects(
    authenticateSocket(socketWithCookie("other=value")),
    /Authentication required/
  );
  await assert.rejects(
    authenticateSocket(socketWithCookie("token=not-a-jwt")),
    /jwt malformed/
  );
});

test("rejects revoked or inactive users even with a valid cookie", async () => {
  const token = jwt.sign({ _id: user._id.toString() }, jwtKey);
  redisClient.exists = async (key) =>
    key === `token:${token}` ? 1 : 0;
  await assert.rejects(
    authenticateSocket(socketWithCookie(`token=${token}`)),
    /Authentication required/
  );

  redisClient.exists = async () => 0;
  Student.findById = () => ({
    select: async () => ({ ...user, isActive: false }),
  });
  await assert.rejects(
    authenticateSocket(socketWithCookie(`token=${token}`)),
    /Authentication required/
  );
});
