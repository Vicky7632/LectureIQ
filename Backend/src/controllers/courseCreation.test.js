const assert = require("node:assert/strict");
const { test } = require("node:test");
const Course = require("../models/course");
const { createCourse } = require("./courseCreation");

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
