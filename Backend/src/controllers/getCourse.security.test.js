const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const test = require("node:test");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const Student = require("../models/student");
const redisClient = require("../config/redis");
const optionalStudent = require("../middleware/optionalMiddleware");
const {
  getCourseById,
  getCourseLectures,
  getPublishedCourses,
} = require("./getCourse");

const originalJwtKey = process.env.JWT_KEY;
const jwtKey = "course-access-test-key";
const originals = {
  courseFind: Course.find,
  courseFindOne: Course.findOne,
  enrollmentAggregate: Enrollment.aggregate,
  enrollmentCountDocuments: Enrollment.countDocuments,
  enrollmentFindOne: Enrollment.findOne,
  lectureFind: Lecture.find,
  studentFindById: Student.findById,
  redisExists: redisClient.exists,
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

const queryResult = (result, onSelect) => ({
  select(fields) {
    onSelect?.(fields);
    return this;
  },
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  },
});

const makeCourse = (overrides = {}) => ({
  _id: "course-1",
  title: "Published course",
  description: "Course description",
  category: "Technology",
  level: "beginner",
  price: 100,
  isPaid: true,
  thumbnail: "https://example.test/course.png",
  teacher: { _id: "teacher-1", firstName: "Course", lastName: "Teacher" },
  status: "published",
  lecturesCount: 2,
  totalDuration: 2,
  enrolledStudents: ["student-private-id"],
  approvedBy: "admin-private-id",
  rejectionReason: "private internal data",
  toObject() {
    return { ...this };
  },
  ...overrides,
});

test.before(() => {
  process.env.JWT_KEY = jwtKey;
});

test.afterEach(() => {
  Course.find = originals.courseFind;
  Course.findOne = originals.courseFindOne;
  Enrollment.aggregate = originals.enrollmentAggregate;
  Enrollment.countDocuments = originals.enrollmentCountDocuments;
  Enrollment.findOne = originals.enrollmentFindOne;
  Lecture.find = originals.lectureFind;
  Student.findById = originals.studentFindById;
  redisClient.exists = originals.redisExists;
});

test.after(() => {
  if (originalJwtKey === undefined) delete process.env.JWT_KEY;
  else process.env.JWT_KEY = originalJwtKey;
});

test("public course detail returns safe fields and an enrollment count, not student IDs", async () => {
  let selectedFields;
  Course.findOne = () =>
    queryResult(makeCourse({ isPaid: false }), (fields) => {
      selectedFields = fields;
    });
  Enrollment.findOne = async () => null;
  Enrollment.countDocuments = async () => 7;
  const response = createResponse();

  await getCourseById({ params: { courseId: "course-1" } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.course.enrollmentCount, 7);
  assert.equal(response.body.course.enrolledStudents, undefined);
  assert.equal(response.body.course.approvedBy, undefined);
  assert.equal(response.body.course.rejectionReason, undefined);
  assert.match(selectedFields, /teacher/);
  assert.doesNotMatch(selectedFields, /enrolledStudents|approvedBy|rejectionReason/);
});

test("public course detail queries only published courses, including draft and rejected IDs", async () => {
  const originalFindOne = Course.findOne;
  const requested = [];
  Course.findOne = (query) => {
    requested.push(query);
    return queryResult(null);
  };

  try {
    for (const courseId of ["draft-course", "rejected-course"]) {
      const response = createResponse();
      await getCourseById({ params: { courseId } }, response);
      assert.equal(response.statusCode, 404);
      assert.deepEqual(response.body, { message: "Course not found" });
    }
    assert.deepEqual(requested, [
      { _id: "draft-course", status: "published" },
      { _id: "rejected-course", status: "published" },
    ]);
  } finally {
    Course.findOne = originalFindOne;
  }
});

test("paid course lectures expose previews to the public but not full lectures", async () => {
  const queries = [];
  Course.findOne = async () => makeCourse();
  Enrollment.findOne = async (query) => {
    queries.push(query);
    return null;
  };
  const previewLectures = [{ _id: "preview", isPreview: true }];
  Lecture.find = (query) => {
    queries.push(query);
    return {
      select: async () => previewLectures,
    };
  };
  const response = createResponse();

  await getCourseLectures(
    { params: { courseId: "course-1" } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.lectures, previewLectures);
  assert.deepEqual(queries[0], { course: "course-1", isPreview: true });
});

test("active enrollment grants full paid-course lectures only for the matching student/course", async () => {
  let enrollmentQuery;
  let lectureQuery;
  Course.findOne = async () => makeCourse();
  Enrollment.findOne = async (query) => {
    enrollmentQuery = query;
    return { status: "active" };
  };
  const lectures = [{ _id: "lecture-1" }, { _id: "lecture-2" }];
  Lecture.find = (query) => {
    lectureQuery = query;
    return { select: async () => lectures };
  };
  const response = createResponse();

  await getCourseLectures(
    {
      params: { courseId: "course-1" },
      student: { _id: "student-1" },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.lectures, lectures);
  assert.deepEqual(enrollmentQuery, {
    student: "student-1",
    course: "course-1",
    status: "active",
  });
  assert.deepEqual(lectureQuery, { course: "course-1" });
});

test("missing or unpublished courses return no lecture resources", async () => {
  Course.findOne = async () => null;
  let queriedLectures = false;
  Lecture.find = () => {
    queriedLectures = true;
    throw new Error("Lecture query must not run");
  };
  const response = createResponse();

  await getCourseLectures({ params: { courseId: "missing" } }, response);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, { message: "Course not found" });
  assert.equal(queriedLectures, false);
});

test("public course listing uses a field allowlist and returns counts, not enrollment IDs", async () => {
  let selectedFields;
  let query;
  Course.find = (filter) => {
    query = filter;
    return queryResult([makeCourse()], (fields) => {
      selectedFields = fields;
    });
  };
  Enrollment.aggregate = async () => [{ _id: "course-1", count: 4 }];
  const response = createResponse();

  await getPublishedCourses({}, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.courses[0].enrollmentCount, 4);
  assert.equal(response.body.courses[0].enrolledStudents, undefined);
  assert.equal(response.body.courses[0].approvedBy, undefined);
  assert.doesNotMatch(selectedFields, /enrolledStudents|approvedBy|rejectionReason/);
  assert.deepEqual(query, { status: "published" });
});

test("optional authentication does not treat inactive or unverified users as enrolled identities", async () => {
  const token = jwt.sign({ _id: "student-1" }, jwtKey);
  for (const user of [
    { isEmailVerified: false, isActive: true },
    { isEmailVerified: true, isActive: false },
  ]) {
    Student.findById = async () => user;
    redisClient.exists = async () => 0;
    const req = { cookies: { token } };
    const response = createResponse();
    let nextCalled = false;

    await optionalStudent(req, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.student, undefined);
  }
});
