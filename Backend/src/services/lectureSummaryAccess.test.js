const assert = require("node:assert/strict");
const test = require("node:test");
const { canSummarizeLecture } = require("../utils/lectureSummaryAccess");

const teacherId = "teacher-1";
const studentId = "student-1";
const lecture = { teacher: teacherId, isPreview: false };
const publishedFreeCourse = {
  teacher: teacherId,
  status: "published",
  isPaid: false,
};

const user = (role, id, overrides = {}) => ({
  _id: id,
  role,
  isEmailVerified: true,
  isActive: true,
  ...overrides,
});

test("allows only the verified, active course teacher to summarize their lecture", () => {
  assert.equal(
    canSummarizeLecture({
      user: user("teacher", teacherId),
      lecture,
      course: publishedFreeCourse,
    }),
    true
  );
  assert.equal(
    canSummarizeLecture({
      user: user("teacher", "another-teacher"),
      lecture,
      course: publishedFreeCourse,
    }),
    false
  );
});

test("allows active verified admins and rejects disabled accounts", () => {
  assert.equal(
    canSummarizeLecture({
      user: user("admin", "admin-1"),
      lecture,
      course: publishedFreeCourse,
    }),
    true
  );
  assert.equal(
    canSummarizeLecture({
      user: user("admin", "admin-1", { isActive: false }),
      lecture,
      course: publishedFreeCourse,
    }),
    false
  );
});

test("allows students access according to published-course enrollment and preview rules", () => {
  assert.equal(
    canSummarizeLecture({
      user: user("student", studentId),
      lecture,
      course: publishedFreeCourse,
    }),
    true
  );
  assert.equal(
    canSummarizeLecture({
      user: user("student", studentId),
      lecture,
      course: { ...publishedFreeCourse, isPaid: true },
      hasActiveEnrollment: true,
    }),
    true
  );
  assert.equal(
    canSummarizeLecture({
      user: user("student", studentId),
      lecture: { ...lecture, isPreview: true },
      course: { ...publishedFreeCourse, isPaid: true },
    }),
    true
  );
  assert.equal(
    canSummarizeLecture({
      user: user("student", studentId),
      lecture,
      course: { ...publishedFreeCourse, isPaid: true },
    }),
    false
  );
  assert.equal(
    canSummarizeLecture({
      user: user("student", studentId),
      lecture,
      course: { ...publishedFreeCourse, status: "draft" },
    }),
    false
  );
});
