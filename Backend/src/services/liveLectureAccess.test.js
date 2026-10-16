const assert = require("node:assert/strict");
const test = require("node:test");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const { loadAuthorizedLiveLecture } = require("./liveLectureAccess");

const teacherId = "507f1f77bcf86cd799439011";
const otherTeacherId = "507f1f77bcf86cd799439012";
const studentId = "507f1f77bcf86cd799439013";
const lectureId = "507f1f77bcf86cd799439014";
const courseId = "507f1f77bcf86cd799439015";

const originals = {
  lectureFindById: Lecture.findById,
  courseFindById: Course.findById,
  enrollmentFindOne: Enrollment.findOne,
};

const query = (result) => ({
  select: async () => result,
});

const withAccessData = async (
  { courseStatus = "published", hasEnrollment = true } = {},
  action
) => {
  Lecture.findById = (id) => {
    assert.equal(String(id), lectureId);
    return query({
      _id: lectureId,
      course: courseId,
      teacher: teacherId,
      lectureType: "live",
      liveStatus: "live",
    });
  };
  Course.findById = (id) => {
    assert.equal(String(id), courseId);
    return query({
      _id: courseId,
      teacher: teacherId,
      status: courseStatus,
    });
  };
  Enrollment.findOne = (filter) => {
    assert.equal(String(filter.student), studentId);
    assert.equal(String(filter.course), courseId);
    assert.equal(filter.status, "active");
    return query(hasEnrollment ? { _id: "active-enrollment" } : null);
  };

  try {
    await action();
  } finally {
    Lecture.findById = originals.lectureFindById;
    Course.findById = originals.courseFindById;
    Enrollment.findOne = originals.enrollmentFindOne;
  }
};

const activeUser = (id, role) => ({
  _id: id,
  role,
  isEmailVerified: true,
  isActive: true,
});

test("permits an active enrolled student to access a live lecture in a published course", async () => {
  await withAccessData({}, async () => {
    const access = await loadAuthorizedLiveLecture(
      activeUser(studentId, "student"),
      lectureId
    );
    assert.equal(access.error, undefined);
    assert.equal(String(access.course._id), courseId);
  });
});

test("denies students access to unpublished live courses even with active enrollment", async () => {
  for (const courseStatus of ["draft", "pending", "rejected"]) {
    await withAccessData({ courseStatus }, async () => {
      const access = await loadAuthorizedLiveLecture(
        activeUser(studentId, "student"),
        lectureId
      );
      assert.equal(access.status, 403);
      assert.equal(access.error, "You cannot access this live session");
    });
  }
});

test("denies a student without active enrollment", async () => {
  await withAccessData({ hasEnrollment: false }, async () => {
    const access = await loadAuthorizedLiveLecture(
      activeUser(studentId, "student"),
      lectureId
    );
    assert.equal(access.status, 403);
  });
});

test("allows the owning teacher to access their live room but denies another teacher", async () => {
  await withAccessData({ courseStatus: "draft" }, async () => {
    const ownerAccess = await loadAuthorizedLiveLecture(
      activeUser(teacherId, "teacher"),
      lectureId
    );
    const otherAccess = await loadAuthorizedLiveLecture(
      activeUser(otherTeacherId, "teacher"),
      lectureId
    );
    assert.equal(ownerAccess.error, undefined);
    assert.equal(otherAccess.status, 403);
  });
});
