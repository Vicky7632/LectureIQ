const test = require("node:test");
const assert = require("node:assert/strict");
const Lecture = require("../models/lecture");
const LectureProgress = require("../models/lectureProgress");
const Enrollment = require("../models/enrollment");
const studentMiddleware = require("../middleware/studentMiddleware");
const studentRouter = require("../routes/studentRoutes");
const { updateLectureProgress } = require("./lectureProgressController");

const studentId = "507f1f77bcf86cd799439011";
const lectureId = "507f1f77bcf86cd799439012";
const courseId = "507f1f77bcf86cd799439013";

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

const requestFor = (overrides = {}) => ({
  params: { lectureId },
  body: { watchedDuration: 42, completed: false },
  student: { _id: studentId, role: "student" },
  ...overrides,
});

const withModelMocks = async (
  { lecture = { course: courseId }, enrollment = { course: courseId }, progress = { watchedDuration: 42, completed: false } } = {},
  action
) => {
  const originals = {
    findLecture: Lecture.findById,
    findEnrollment: Enrollment.findOne,
    updateProgress: LectureProgress.findOneAndUpdate,
  };
  let lectureLookupCount = 0;
  let enrollmentQuery;
  let progressFilter;
  let progressUpdate;
  let progressOptions;

  Lecture.findById = () => {
    lectureLookupCount += 1;
    return { select: async () => lecture };
  };
  Enrollment.findOne = async (query) => {
    enrollmentQuery = query;
    return enrollment;
  };
  LectureProgress.findOneAndUpdate = async (filter, update, options) => {
    progressFilter = filter;
    progressUpdate = update;
    progressOptions = options;
    return progress;
  };

  try {
    const res = createResponse();
    await action({
      req: requestFor(),
      res,
      getCaptured: () => ({
        lectureLookupCount,
        enrollmentQuery,
        progressFilter,
        progressUpdate,
        progressOptions,
      }),
    });
    return { res, ...{ lectureLookupCount, enrollmentQuery, progressFilter, progressUpdate, progressOptions } };
  } finally {
    Lecture.findById = originals.findLecture;
    Enrollment.findOne = originals.findEnrollment;
    LectureProgress.findOneAndUpdate = originals.updateProgress;
  }
};

test("registers the authenticated progress endpoint as POST under the student prefix", () => {
  const route = studentRouter.stack.find(
    (layer) => layer.route?.path === "/lecture/:lectureId/progress"
  )?.route;

  assert.ok(route);
  assert.equal(Boolean(route.methods.post), true);
  assert.equal(Boolean(route.methods.put), false);
  assert.equal(route.stack.length, 2);
  assert.equal(route.stack[0].handle, studentMiddleware);
});

test("updates progress for the lecture's course and authenticated student", async () => {
  const { res, enrollmentQuery, progressFilter, progressUpdate, progressOptions } =
    await withModelMocks({}, async ({ req, res }) => {
      await updateLectureProgress(req, res);
    });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Progress updated");
  assert.deepEqual(enrollmentQuery, {
    student: studentId,
    course: courseId,
    status: "active",
  });
  assert.deepEqual(progressFilter, { student: studentId, lecture: lectureId });
  assert.equal(progressUpdate.watchedDuration, 42);
  assert.equal(progressUpdate.completed, false);
  assert.equal(progressUpdate.course, courseId);
  assert.ok(progressUpdate.lastWatchedAt instanceof Date);
  assert.deepEqual(progressOptions, { upsert: true, new: true });
});

test("rejects invalid lecture IDs before querying progress data", async () => {
  const { res, lectureLookupCount } = await withModelMocks({}, async ({ req, res }) => {
    req.params.lectureId = "not-an-object-id";
    await updateLectureProgress(req, res);
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid lecture ID");
  assert.equal(lectureLookupCount, 0);
});

test("rejects unauthenticated or non-student requests", async () => {
  const unauthenticated = await withModelMocks({}, async ({ req, res }) => {
    req.student = null;
    await updateLectureProgress(req, res);
  });
  assert.equal(unauthenticated.res.statusCode, 401);
  assert.equal(unauthenticated.lectureLookupCount, 0);

  const teacher = await withModelMocks({}, async ({ req, res }) => {
    req.student.role = "teacher";
    await updateLectureProgress(req, res);
  });
  assert.equal(teacher.res.statusCode, 403);
  assert.equal(teacher.res.body.message, "Student access only");
  assert.equal(teacher.lectureLookupCount, 0);
});

test("rejects progress writes when the student is not enrolled in the lecture course", async () => {
  const { res } = await withModelMocks({ enrollment: null }, async ({ req, res }) => {
    await updateLectureProgress(req, res);
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Not enrolled");
});

test("rejects invalid progress payloads", async () => {
  const { res, lectureLookupCount } = await withModelMocks({}, async ({ req, res }) => {
    req.body.watchedDuration = -1;
    await updateLectureProgress(req, res);
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid lecture progress");
  assert.equal(lectureLookupCount, 0);
});
