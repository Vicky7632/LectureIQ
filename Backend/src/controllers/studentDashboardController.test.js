const assert = require("node:assert/strict");
const test = require("node:test");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const LectureProgress = require("../models/lectureProgress");
const {
  getMyCoursesDashboard,
} = require("./studentDashboardController");

const response = () => ({
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

test("student dashboard uses authenticated identity and excludes unpublished courses", async () => {
  const originals = {
    enrollmentFind: Enrollment.find,
    lectureCount: Lecture.countDocuments,
    progressCount: LectureProgress.countDocuments,
    progressFind: LectureProgress.findOne,
  };
  const studentId = "student-authenticated";
  const publishedCourse = {
    _id: "published-course",
    title: "Published",
    thumbnail: "published.png",
  };
  let enrollmentQuery;
  let populateOptions;
  Enrollment.find = (query) => {
    enrollmentQuery = query;
    return {
      populate: async (options) => {
        populateOptions = options;
        return [
          { course: publishedCourse },
          { course: null },
        ];
      },
    };
  };
  Lecture.countDocuments = async (query) => {
    assert.equal(String(query.course), publishedCourse._id);
    return 0;
  };
  LectureProgress.countDocuments = async () => 0;
  LectureProgress.findOne = () => ({
    sort: () => ({
      populate: async () => null,
    }),
  });

  try {
    const res = response();
    await getMyCoursesDashboard(
      {
        student: { _id: studentId, role: "student" },
        user: { _id: "different-user" },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(enrollmentQuery, {
      student: studentId,
      status: "active",
    });
    assert.deepEqual(populateOptions, {
      path: "course",
      match: { status: "published" },
      select: "_id title thumbnail",
    });
    assert.deepEqual(res.body.courses, [
      {
        courseId: publishedCourse._id,
        title: publishedCourse.title,
        thumbnail: publishedCourse.thumbnail,
        progressPercent: 0,
        lastWatchedLecture: null,
      },
    ]);
  } finally {
    Enrollment.find = originals.enrollmentFind;
    Lecture.countDocuments = originals.lectureCount;
    LectureProgress.countDocuments = originals.progressCount;
    LectureProgress.findOne = originals.progressFind;
  }
});
