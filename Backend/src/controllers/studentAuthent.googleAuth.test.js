const assert = require("node:assert/strict");
const test = require("node:test");
const { OAuth2Client } = require("google-auth-library");
const Student = require("../models/student");

const originalJwtKey = process.env.JWT_KEY;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalFindOne = Student.findOne;
const originalCreate = Student.create;
const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
process.env.JWT_KEY = "google-auth-test-signing-key";
process.env.GOOGLE_CLIENT_ID = "google-auth-test-client";
let createdUser;
OAuth2Client.prototype.verifyIdToken = async () => ({
  getPayload: () => ({
    email: "google-user@example.test",
    given_name: "Google",
    family_name: "User",
    email_verified: true,
    picture: "https://example.test/avatar.png",
  }),
});
Student.findOne = async () => null;
Student.create = async (user) => {
  createdUser = user;
  return { _id: "google-user-id", ...user };
};
const { googleAuth } = require("./studentAuthent");

test.after(() => {
  Student.findOne = originalFindOne;
  Student.create = originalCreate;
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
  if (originalJwtKey === undefined) delete process.env.JWT_KEY;
  else process.env.JWT_KEY = originalJwtKey;
  if (originalGoogleClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
});

test("persists Google-verified status in the Student schema field", async () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    cookie() {},
    json(body) {
      this.body = body;
      return this;
    },
  };

  await googleAuth({ body: { credential: "test-google-credential" } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(createdUser.isEmailVerified, true);
  assert.equal(createdUser.isVerified, undefined);
  assert.ok(createdUser.emailVerifiedAt instanceof Date);
});
