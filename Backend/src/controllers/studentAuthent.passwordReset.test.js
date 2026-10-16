const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const nodemailer = require("nodemailer");

const originalJwtKey = process.env.JWT_KEY;
const originalFrontendUrl = process.env.FRONTEND_URL;
process.env.JWT_KEY = "password-reset-test-signing-key";
process.env.FRONTEND_URL = "https://lectureiq.example.test";
const { forgotPassword, resetPassword } = require("./studentAuthent");
if (originalJwtKey === undefined) delete process.env.JWT_KEY;
else process.env.JWT_KEY = originalJwtKey;
if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
else process.env.FRONTEND_URL = originalFrontendUrl;

const userId = "507f1f77bcf86cd799439011";
const resetJwtKey = "password-reset-test-signing-key";
const tokenHash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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

const withResetFixture = async ({ tokenOptions = {} } = {}, action) => {
  const originals = {
    findById: Student.findById,
    findOneAndUpdate: Student.findOneAndUpdate,
    password: process.env.JWT_KEY,
  };
  const token = jwt.sign(
    { _id: userId, type: "RESET_PASSWORD" },
    resetJwtKey,
    tokenOptions
  );
  const user = {
    _id: userId,
    password: await bcrypt.hash("CurrentPass1!", 4),
    passwordResetTokenHash: tokenHash(token),
    passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    passwordChangedAt: null,
  };
  const state = { updateCount: 0 };

  process.env.JWT_KEY = resetJwtKey;
  Student.findById = () => ({
    select: async () => user,
  });
  Student.findOneAndUpdate = async (filter, update) => {
    const matches =
      String(filter._id) === String(user._id) &&
      filter.passwordResetTokenHash === user.passwordResetTokenHash &&
      user.passwordResetExpiresAt > filter.passwordResetExpiresAt.$gt;
    if (!matches) {
      return null;
    }
    Object.assign(user, update.$set);
    for (const field of Object.keys(update.$unset)) {
      delete user[field];
    }
    state.updateCount += 1;
    return user;
  };

  try {
    await action({ token, user, state });
  } finally {
    Student.findById = originals.findById;
    Student.findOneAndUpdate = originals.findOneAndUpdate;
    if (originals.password === undefined) delete process.env.JWT_KEY;
    else process.env.JWT_KEY = originals.password;
  }
};

test("resets password and atomically consumes the reset token", async () => {
  await withResetFixture({}, async ({ token, user, state }) => {
    const response = createResponse();
    await resetPassword(
      {
        body: {
          token,
          newPassword: "NewStrongPass2!",
          confirmPassword: "NewStrongPass2!",
        },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(state.updateCount, 1);
    assert.ok(await bcrypt.compare("NewStrongPass2!", user.password));
    assert.ok(user.passwordChangedAt instanceof Date);
    assert.equal(user.passwordResetTokenHash, undefined);
    assert.equal(user.passwordResetExpiresAt, undefined);

    const replayResponse = createResponse();
    await resetPassword(
      {
        body: {
          token,
          newPassword: "AnotherStrongPass3!",
          confirmPassword: "AnotherStrongPass3!",
        },
      },
      replayResponse
    );

    assert.equal(replayResponse.statusCode, 401);
    assert.equal(state.updateCount, 1);
  });
});

test("rejects expired reset tokens without updating the password", async () => {
  await withResetFixture({ tokenOptions: { expiresIn: -1 } }, async ({ token, user, state }) => {
    const oldPassword = user.password;
    const response = createResponse();
    await resetPassword(
      {
        body: {
          token,
          newPassword: "NewStrongPass2!",
          confirmPassword: "NewStrongPass2!",
        },
      },
      response
    );

    assert.equal(response.statusCode, 401);
    assert.equal(state.updateCount, 0);
    assert.equal(user.password, oldPassword);
  });
});

test("rejects malformed reset tokens without updating the password", async () => {
  await withResetFixture({}, async ({ user, state }) => {
    const oldPassword = user.password;
    const response = createResponse();
    await resetPassword(
      {
        body: {
          token: "not-a-valid-token",
          newPassword: "NewStrongPass2!",
          confirmPassword: "NewStrongPass2!",
        },
      },
      response
    );

    assert.equal(response.statusCode, 401);
    assert.equal(state.updateCount, 0);
    assert.equal(user.password, oldPassword);
  });
});

test("sends reset link without logging reset credentials", async () => {
  const originalFindOne = Student.findOne;
  const originalCreateTransport = nodemailer.createTransport;
  const originalLog = console.log;
  const originalError = console.error;
  const originalEmailUser = process.env.EMAIL_USER;
  const originalJwtKey = process.env.JWT_KEY;
  const sentMail = [];
  const logs = [];
  const user = {
    _id: userId,
    firstName: "Test",
    email: "test@example.com",
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    async save() {
      return this;
    },
  };
  process.env.JWT_KEY = resetJwtKey;
  process.env.EMAIL_USER = "mailer@example.test";
  Student.findOne = async () => user;
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => sentMail.push(mail),
  });
  console.log = (...args) => logs.push(args.join(" "));
  console.error = (...args) => logs.push(args.join(" "));

  try {
    const response = createResponse();
    await forgotPassword({ body: { email: user.email } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(sentMail.length, 1);
    const token = new URL(sentMail[0].html.match(/href="([^"]+)"/)[1]).searchParams.get("token");
    assert.ok(token);
    assert.equal(user.passwordResetTokenHash, tokenHash(token));
    assert.ok(user.passwordResetExpiresAt instanceof Date);
    assert.ok(logs.every((entry) => !entry.includes(token)));
    assert.ok(logs.every((entry) => !entry.includes("reset-password?token=")));
    assert.equal(logs.length, 0);
  } finally {
    Student.findOne = originalFindOne;
    nodemailer.createTransport = originalCreateTransport;
    console.log = originalLog;
    console.error = originalError;
    if (originalEmailUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalEmailUser;
    if (originalJwtKey === undefined) delete process.env.JWT_KEY;
    else process.env.JWT_KEY = originalJwtKey;
  }
});
