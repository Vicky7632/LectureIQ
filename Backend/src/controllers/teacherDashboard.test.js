const test = require("node:test");
const assert = require("node:assert/strict");
const Course = require("../models/course");
const Lecture = require("../models/lecture");
const { getTeacherCourseLectures } = require("./teacherDashboard");

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
