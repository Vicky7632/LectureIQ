const test = require("node:test");
const assert = require("node:assert/strict");
const Enrollment = require("../models/enrollment");

const originalKeyId = process.env.RAZORPAY_KEY_ID;
const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "test-key-id";
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "test-key-secret";
const { createOrder } = require("./purchaseCourse");
if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
else process.env.RAZORPAY_KEY_ID = originalKeyId;
if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
else process.env.RAZORPAY_KEY_SECRET = originalKeySecret;

const studentId = "507f1f77bcf86cd799439011";
const courseId = "507f1f77bcf86cd799439012";

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

const withExistingEnrollment = async (enrollment, action) => {
  const originalFindOne = Enrollment.findOne;
  let query;
  Enrollment.findOne = async (filter) => {
    query = filter;
    return enrollment;
  };

  try {
    const req = {
      student: { _id: studentId, role: "student" },
      params: { courseId },
    };
    const res = createResponse();
    await action(req, res);
    return { res, query };
  } finally {
    Enrollment.findOne = originalFindOne;
  }
};

test("returns an existing active paid-course enrollment without creating an order", async () => {
  const enrollment = {
    _id: "existing-enrollment",
    student: studentId,
    course: courseId,
    status: "active",
  };
  const { res, query } = await withExistingEnrollment(enrollment, createOrder);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadyEnrolled, true);
  assert.equal(res.body.enrollment, enrollment);
  assert.deepEqual(query, { student: studentId, course: courseId });
  assert.equal(res.body.orderId, undefined);
});

test("returns a pending enrollment without creating another enrollment or payment order", async () => {
  const enrollment = {
    _id: "pending-enrollment",
    student: studentId,
    course: courseId,
    status: "pending",
  };
  const { res } = await withExistingEnrollment(enrollment, createOrder);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadyEnrolled, false);
  assert.equal(res.body.enrollment, enrollment);
  assert.equal(res.body.orderId, undefined);
});

test("rejects a non-student before looking up enrollment", async () => {
  const originalFindOne = Enrollment.findOne;
  Enrollment.findOne = () => {
    assert.fail("Enrollment lookup must not run for non-students");
  };

  try {
    const req = {
      student: { _id: studentId, role: "teacher" },
      params: { courseId },
    };
    const res = createResponse();
    await createOrder(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Student access only");
  } finally {
    Enrollment.findOne = originalFindOne;
  }
});
