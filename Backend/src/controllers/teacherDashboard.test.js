const test = require("node:test");
const assert = require("node:assert/strict");
const Course = require("../models/course");
const Lecture = require("../models/lecture");
const Enrollment = require("../models/enrollment");
const {
  getCourseStudents,
  getTeacherCourseLectures,
} = require("./teacherDashboard");

const invokeController = async (req, course) => {
  const originalFindOne = Course.findOne;
  const originalFind = Lecture.find;
  let selectedFields;

  Course.findOne = async () => course;
  Lecture.find = () => ({
    select(fields) {
      selectedFields = fields;
      return this;
    },
    sort: async () => [
      {
        _id: "lecture-1",
        title: "Lecture",
        description: "Lecture description",
        videoUrl: "https://res.cloudinary.com/example/video/upload/source.webm",
        order: 1,
      },
    ],
  });

  const res = {
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
  };

  try {
    await getTeacherCourseLectures(req, res);
  } finally {
    Course.findOne = originalFindOne;
    Lecture.find = originalFind;
  }

  return { res, selectedFields };
};

test("returns playback URLs only for a course owned by the authenticated teacher", async () => {
  const course = { _id: "course-1", title: "Owned course" };
  const { res, selectedFields } = await invokeController(
    {
      params: { courseId: "course-1" },
      user: { _id: "teacher-1" },
    },
    course
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.courseTitle, "Owned course");
  assert.equal(
    res.body.lectures[0].videoUrl,
    "https://res.cloudinary.com/example/video/upload/source.webm"
  );
  assert.match(selectedFields, /videoUrl/);
  assert.match(selectedFields, /description/);
});

test("denies access when the requested course is not owned by the teacher", async () => {
  const { res } = await invokeController(
    {
      params: { courseId: "course-1" },
      user: { _id: "teacher-1" },
    },
    null
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Access denied: Not your course");
});

const invokeRosterController = async ({ teacherId, courseId, ownedCourse, enrollments = [] }) => {
  const originalCourseFindOne = Course.findOne;
  const originalEnrollmentFind = Enrollment.find;
  let enrollmentQuery;
  let populatedFields;
  let sortQuery;

  Course.findOne = async (query) => {
    assert.equal(String(query._id), String(courseId));
    assert.equal(String(query.teacher), String(teacherId));
    return ownedCourse;
  };
  Enrollment.find = (query) => {
    enrollmentQuery = query;
    return {
      populate(path, fields) {
        populatedFields = { path, fields };
        return this;
      },
      sort(query) {
        sortQuery = query;
        return Promise.resolve(enrollments);
      },
    };
  };

  const res = {
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
  };

  try {
    await getCourseStudents(
      { params: { courseId }, user: { _id: teacherId } },
      res
    );
  } finally {
    Course.findOne = originalCourseFindOne;
    Enrollment.find = originalEnrollmentFind;
  }

  return { res, enrollmentQuery, populatedFields, sortQuery };
};

test("returns the existing roster response for the owning teacher, preserving enrollment statuses", async () => {
  const enrollments = [
    { status: "active", student: { email: "active@example.com" } },
    { status: "pending", student: { email: "pending@example.com" } },
    { status: "cancelled", student: { email: "cancelled@example.com" } },
    { status: "expired", student: { email: "expired@example.com" } },
  ];
  const { res, enrollmentQuery, populatedFields, sortQuery } =
    await invokeRosterController({
      teacherId: "teacher-1",
      courseId: "course-1",
      ownedCourse: { _id: "course-1", teacher: "teacher-1" },
      enrollments,
    });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { students: enrollments });
  assert.deepEqual(enrollmentQuery, { course: "course-1" });
  assert.deepEqual(populatedFields, {
    path: "student",
    fields: "firstName lastName email",
  });
  assert.deepEqual(sortQuery, { enrolledAt: -1 });
  assert.deepEqual(
    res.body.students.map(({ status }) => status),
    ["active", "pending", "cancelled", "expired"]
  );
});

test("does not query or return the roster for another teacher's course", async () => {
  let enrollmentQueried = false;
  const originalEnrollmentFind = Enrollment.find;
  Enrollment.find = () => {
    enrollmentQueried = true;
    throw new Error("Enrollment query must not run for an unauthorized course");
  };

  try {
    const { res } = await invokeRosterController({
      teacherId: "teacher-1",
      courseId: "course-2",
      ownedCourse: null,
    });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      success: false,
      message: "Access denied: Not your course",
    });
    assert.equal(enrollmentQueried, false);
  } finally {
    Enrollment.find = originalEnrollmentFind;
  }
});

test("does not query the roster when the requested course does not exist", async () => {
  let enrollmentQueried = false;
  const originalEnrollmentFind = Enrollment.find;
  Enrollment.find = () => {
    enrollmentQueried = true;
    throw new Error("Enrollment query must not run for a missing course");
  };

  try {
    const { res } = await invokeRosterController({
      teacherId: "teacher-1",
      courseId: "missing-course",
      ownedCourse: null,
    });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      success: false,
      message: "Access denied: Not your course",
    });
    assert.equal(enrollmentQueried, false);
  } finally {
    Enrollment.find = originalEnrollmentFind;
  }
});
