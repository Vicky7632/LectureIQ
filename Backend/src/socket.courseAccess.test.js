
const assert = require("node:assert/strict");
const test = require("node:test");
const Course = require("./models/course");
const Enrollment = require("./models/enrollment");
const { canSubscribeToCourse } = require("./socket");

const originalCourseFindById = Course.findById;
const originalEnrollmentFindOne = Enrollment.findOne;
const courseId = "507f1f77bcf86cd799439011";
const studentId = "507f1f77bcf86cd799439012";

const query = (value) => ({
  select: async () => value,
});

const withAccessMocks = async ({ course, enrollment }, callback) => {
  Course.findById = () => query(course);
  Enrollment.findOne = (filter) => {
    assert.equal(String(filter.student), studentId);
    assert.equal(String(filter.course), courseId);
    assert.equal(filter.status, "active");
    return query(enrollment);
  };
  try {
    await callback();
  } finally {
    Course.findById = originalCourseFindById;
    Enrollment.findOne = originalEnrollmentFindOne;
  }
};

const student = (overrides = {}) => ({
  _id: studentId,
  role: "student",
  isEmailVerified: true,
  isActive: true,
  ...overrides,
});

test("allows an active enrolled student to subscribe to a published course room", async () => {
  await withAccessMocks(
    {
      course: { _id: courseId, status: "published" },
      enrollment: { _id: "enrollment-1" },
    },
    async () => {
      const access = await canSubscribeToCourse(student(), courseId);
      assert.equal(access.ok, true);
      assert.equal(access.course.status, "published");
    }
  );
});

test("rejects students without active enrollment and unpublished courses", async () => {
  await withAccessMocks(
    {
      course: { _id: courseId, status: "published" },
      enrollment: null,
    },
    async () => {
      const access = await canSubscribeToCourse(student(), courseId);
      assert.equal(access.ok, false);
      assert.equal(access.error, "Course access denied");
    }
  );
  await withAccessMocks(
    { course: null, enrollment: { _id: "enrollment-1" } },
    async () => {
      const access = await canSubscribeToCourse(student(), courseId);
      assert.equal(access.ok, false);
      assert.equal(access.error, "Course access denied");
    }
  );
  await withAccessMocks(
    {
      course: { _id: courseId, status: "draft" },
      enrollment: { _id: "enrollment-1" },
    },
    async () => {
      const access = await canSubscribeToCourse(student(), courseId);
      assert.equal(access.ok, false);
      assert.equal(access.error, "Course access denied");
    }
  );
  await withAccessMocks(
    {
      course: { _id: courseId, status: "rejected" },
      enrollment: { _id: "enrollment-1" },
    },
    async () => {
      const access = await canSubscribeToCourse(student(), courseId);
      assert.equal(access.ok, false);
      assert.equal(access.error, "Course access denied");
    }
  );
});

test("rejects unauthorized roles, inactive accounts, and invalid course IDs", async () => {
  await withAccessMocks(
    {
      course: { _id: courseId, status: "published" },
      enrollment: { _id: "enrollment-1" },
    },
    async () => {
      assert.equal(
        (await canSubscribeToCourse(student({ role: "teacher" }), courseId)).ok,
        false
      );
      assert.equal(
        (
          await canSubscribeToCourse(
            student({ isEmailVerified: false }),
            courseId
          )
        ).ok,
        false
      );
      assert.equal(
        (await canSubscribeToCourse(student({ isActive: false }), courseId)).ok,
        false
      );
      assert.equal(
        (await canSubscribeToCourse(student(), "not-a-course-id")).ok,
        false
      );
    }
  );
});
