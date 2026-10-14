const test = require("node:test");
const assert = require("node:assert/strict");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const studentMiddleware = require("../middleware/studentMiddleware");
const courseRouter = require("../routes/courseGet");
const { enrollInCourse } = require("./getCourse");
const { getMyEnrollments } = require("./studentDashboardController");

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

const createEnrollment = (overrides = {}) => ({
  _id: "enrollment-1",
  student: studentId,
  course: courseId,
  status: "active",
  paymentStatus: "free",
  ...overrides,
});

const withEnrollmentMocks = async (
  { course = { _id: courseId, isPaid: false }, findResults = [], createResult } = {},
  action
) => {
  const originals = {
    findCourse: Course.findOne,
    findEnrollment: Enrollment.findOne,
    createEnrollment: Enrollment.create,
  };
  const queries = [];
  let createCount = 0;
  Course.findOne = async () => course;
  Enrollment.findOne = async (query) => {
    queries.push(query);
    return findResults.shift() || null;
  };
  Enrollment.create = async (data) => {
    createCount += 1;
    if (createResult instanceof Error) throw createResult;
    return createResult || { ...data, _id: "new-enrollment" };
  };

  try {
    const res = createResponse();
    await action({
      req: {
        params: { courseId },
        student: { _id: studentId, role: "student" },
      },
      res,
    });
    return { res, queries, createCount };
  } finally {
    Course.findOne = originals.findCourse;
    Enrollment.findOne = originals.findEnrollment;
    Enrollment.create = originals.createEnrollment;
  }
};

test("registers the authenticated free-course enrollment endpoint", () => {
  const route = courseRouter.stack.find(
    (layer) => layer.route?.path === "/course/:courseId/enroll"
  )?.route;

  assert.ok(route);
  assert.equal(Boolean(route.methods.post), true);
  assert.equal(route.stack[0].handle, studentMiddleware);
});

test("creates one active free-course enrollment for the authenticated student", async () => {
  const { res, queries, createCount } = await withEnrollmentMocks(
    {},
    async ({ req, res }) => enrollInCourse(req, res)
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.enrollment.student, studentId);
  assert.equal(res.body.enrollment.course, courseId);
  assert.equal(res.body.enrollment.status, "active");
  assert.equal(res.body.enrollment.paymentStatus, "free");
  assert.equal(res.body.alreadyEnrolled, false);
  assert.equal(createCount, 1);
  assert.deepEqual(queries[0], { student: studentId, course: courseId });
});

test("returns an existing active enrollment instead of creating a duplicate", async () => {
  const existing = createEnrollment();
  const { res, createCount } = await withEnrollmentMocks(
    { findResults: [existing] },
    async ({ req, res }) => enrollInCourse(req, res)
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadyEnrolled, true);
  assert.equal(res.body.enrollment, existing);
  assert.equal(createCount, 0);
});

test("recovers a duplicate-key race by returning the existing enrollment", async () => {
  const existing = createEnrollment();
  const { res, queries, createCount } = await withEnrollmentMocks(
    {
      findResults: [null, existing],
      createResult: Object.assign(new Error("duplicate key"), { code: 11000 }),
    },
    async ({ req, res }) => enrollInCourse(req, res)
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadyEnrolled, true);
  assert.equal(res.body.enrollment, existing);
  assert.equal(createCount, 1);
  assert.equal(queries.length, 2);
});

test("does not create a free enrollment for a paid course", async () => {
  const { res, createCount } = await withEnrollmentMocks(
    { course: { _id: courseId, isPaid: true } },
    async ({ req, res }) => enrollInCourse(req, res)
  );

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, "Payment is required to enroll in this course");
  assert.equal(createCount, 0);
});

test("rejects non-student enrollment requests", async () => {
  const { res, createCount } = await withEnrollmentMocks({}, async ({ req, res }) => {
    req.student.role = "teacher";
    await enrollInCourse(req, res);
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Student access only");
  assert.equal(createCount, 0);
});

test("uses a unique database index for student and course pairs", () => {
  const enrollmentIndex = Enrollment.schema.indexes().find(
    ([fields, options]) =>
      fields.student === 1 && fields.course === 1 && options.unique === true
  );

  assert.ok(enrollmentIndex);
});

test("a fresh enrollment-status request returns the persisted active enrollment", async () => {
  const existing = createEnrollment();
  const originalFind = Enrollment.find;
  let query;
  Enrollment.find = (filter) => {
    query = filter;
    return {
      populate: async () => [existing],
    };
  };

  try {
    const req = { student: { _id: studentId, role: "student" } };
    const res = createResponse();
    await getMyEnrollments(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(query, { student: studentId });
    assert.deepEqual(res.body.enrollments, [existing]);
    assert.equal(res.body.enrollments[0].status, "active");
  } finally {
    Enrollment.find = originalFind;
  }
});

test("rejects enrollment-status requests from non-students", async () => {
  const originalFind = Enrollment.find;
  Enrollment.find = () => {
    assert.fail("Enrollment lookup should not run for a non-student");
  };

  try {
    const req = { student: { _id: studentId, role: "teacher" } };
    const res = createResponse();
    await getMyEnrollments(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Student access only");
  } finally {
    Enrollment.find = originalFind;
  }
});
