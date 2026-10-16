const assert = require("node:assert/strict");
const { test } = require("node:test");
const Course = require("../models/course");
const teacherMiddleware = require("../middleware/teacherMiddleware");
const courseRouter = require("../routes/courseCreate");
const { createCourse, submitCourseForReview } = require("./courseCreation");

test("createCourse uses the thumbnail URL produced by upload middleware", async () => {
  const originalCreate = Course.create;
  let createdCourse;
  Course.create = async (data) => {
    createdCourse = data;
    return data;
  };

  const req = {
    user: { _id: "teacher-id" },
    body: {
      title: "Course title",
      description: "A course description",
      category: "Web Development",
      level: "beginner",
      price: "0",
    },
    thumbnailData: { thumbnailUrl: "https://cdn.example/course.jpg" },
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
    await createCourse(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(createdCourse.thumbnail, "https://cdn.example/course.jpg");
    assert.equal(res.body.course.thumbnail, "https://cdn.example/course.jpg");
  } finally {
    Course.create = originalCreate;
  }
});

const invokeSubmitCourse = async ({
  teacherId = "teacher-id",
  course = {
    _id: "course-id",
    teacher: "teacher-id",
    status: "draft",
    title: "Course title",
    description: "Course description",
    category: "Web Development",
    level: "beginner",
    lecturesCount: 1,
    isPaid: false,
    price: 0,
    save: async function save() {
      return this;
    },
  },
  findError,
} = {}) => {
  const originalFindOne = Course.findOne;
  let query;
  Course.findOne = async (filter) => {
    query = filter;
    if (findError) throw findError;
    return course;
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
    await submitCourseForReview(
      { params: { courseId: "course-id" }, user: { _id: teacherId } },
      res
    );
    return { res, query, course };
  } finally {
    Course.findOne = originalFindOne;
  }
};

test("registers course submission behind teacher authentication", () => {
  const route = courseRouter.stack.find(
    (layer) => layer.route?.path === "/submit/:courseId"
  )?.route;

  assert.ok(route);
  assert.equal(Boolean(route.methods.patch), true);
  assert.equal(route.stack[0].handle, teacherMiddleware);
});

test("allows the owning teacher to submit an eligible draft for review", async () => {
  let saved = false;
  const course = {
    _id: "course-id",
    teacher: "teacher-id",
    status: "draft",
    title: "Course title",
    description: "Course description",
    category: "Web Development",
    level: "beginner",
    lecturesCount: 1,
    isPaid: false,
    price: 0,
    save: async function save() {
      saved = true;
      return this;
    },
  };
  const { res, query } = await invokeSubmitCourse({ course });

  assert.deepEqual(query, { _id: "course-id", teacher: "teacher-id" });
  assert.equal(saved, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.course.status, "pending");
  assert.equal(res.body.message, "Course submitted for admin review");
});

test("does not find or submit a course owned by another teacher", async () => {
  const { res, query } = await invokeSubmitCourse({
    teacherId: "different-teacher",
    course: null,
  });

  assert.deepEqual(query, {
    _id: "course-id",
    teacher: "different-teacher",
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Course not found");
});

test("rejects incomplete and ineligible courses without saving", async () => {
  const cases = [
    {
      course: {
        status: "draft",
        title: "Course title",
        description: "Course description",
        category: "Web Development",
        level: "beginner",
        lecturesCount: 0,
        isPaid: false,
        price: 0,
      },
      expectedMessage: "Add at least one lecture before submitting",
    },
    {
      course: {
        status: "draft",
        title: "",
        description: "Course description",
        category: "Web Development",
        level: "beginner",
        lecturesCount: 1,
        isPaid: false,
        price: 0,
      },
      expectedMessage: "Course details incomplete",
    },
    {
      course: {
        status: "draft",
        title: "Course title",
        description: "Course description",
        category: "Web Development",
        level: "beginner",
        lecturesCount: 1,
        isPaid: true,
        price: 0,
      },
      expectedMessage: "Paid course must have a valid price",
    },
    {
      course: {
        status: "published",
        title: "Course title",
        description: "Course description",
        category: "Web Development",
        level: "beginner",
        lecturesCount: 1,
        isPaid: false,
        price: 0,
      },
      expectedMessage: "Only draft courses can be submitted",
    },
  ];

  for (const { course: details, expectedMessage } of cases) {
    let saved = false;
    const course = {
      _id: "course-id",
      teacher: "teacher-id",
      ...details,
      save: async () => {
        saved = true;
      },
    };
    const { res } = await invokeSubmitCourse({ course });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, expectedMessage);
    assert.equal(saved, false);
  }
});

test("reports a failed course submission save without returning success", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const { res } = await invokeSubmitCourse({
      course: {
        _id: "course-id",
        teacher: "teacher-id",
        status: "draft",
        title: "Course title",
        description: "Course description",
        category: "Web Development",
        level: "beginner",
        lecturesCount: 1,
        isPaid: false,
        price: 0,
        save: async () => {
          throw new Error("database unavailable");
        },
      },
    });

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Internal server error");
  } finally {
    console.error = originalConsoleError;
  }
});
