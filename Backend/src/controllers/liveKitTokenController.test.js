const assert = require("node:assert/strict");
const test = require("node:test");
const Lecture = require("../models/lecture");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const { getLiveKitToken } = require("./liveKitTokenController");

const lectureId = "507f1f77bcf86cd799439011";
const teacherId = "507f191e810c19729de860ea";
const studentId = "507f1f77bcf86cd799439012";
const roomName = "room_demo123";

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

const makeQuery = (value) => ({ select: async () => value });

const withModels = async ({ user, liveStatus = "live", enrollment = true }) => {
  const originals = {
    lecture: Lecture.findById,
    course: Course.findById,
    enrollment: Enrollment.findOne,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    url: process.env.LIVEKIT_URL,
  };

  const lecture = {
    _id: lectureId,
    title: "Demo classroom",
    description: "A live session",
    course: "507f1f77bcf86cd799439013",
    teacher: teacherId,
    lectureType: "live",
    liveStatus,
    liveRoomId: roomName,
  };
  const course = {
    _id: lecture.course,
    teacher: teacherId,
    status: "published",
    title: "Demo course",
  };

  Lecture.findById = () => makeQuery(lecture);
  Course.findById = () => makeQuery(course);
  Enrollment.findOne = () => makeQuery(enrollment ? { _id: "enrollment-id" } : null);
  process.env.LIVEKIT_API_KEY = "test-api-key";
  process.env.LIVEKIT_API_SECRET = "test-api-secret";
  process.env.LIVEKIT_URL = "wss://livekit.example.test";

  try {
    const response = createResponse();
    await getLiveKitToken(
      { user, params: { lectureId } },
      response
    );
    return response;
  } finally {
    Lecture.findById = originals.lecture;
    Course.findById = originals.course;
    Enrollment.findOne = originals.enrollment;
    for (const [key, value] of [
      ["LIVEKIT_API_KEY", originals.apiKey],
      ["LIVEKIT_API_SECRET", originals.apiSecret],
      ["LIVEKIT_URL", originals.url],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const makeUser = (role, id) => ({
  _id: id,
  role,
  firstName: role === "teacher" ? "Terry" : "Sam",
  lastName: "Demo",
  isEmailVerified: true,
  isActive: true,
});

test("issues a room-scoped publishing token only to the owning teacher", async () => {
  const response = await withModels({
    user: makeUser("teacher", teacherId),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.serverUrl, "wss://livekit.example.test");
  assert.equal(response.body.roomName, roomName);
  const claims = JSON.parse(
    Buffer.from(response.body.token.split(".")[1], "base64url").toString()
  );
  assert.equal(claims.sub, teacherId);
  assert.equal(claims.video.room, roomName);
  assert.equal(claims.video.roomJoin, true);
  assert.equal(claims.video.canPublish, true);
  assert.equal(claims.video.canSubscribe, true);
});

test("issues enrolled students a subscribe-only token for a live lecture", async () => {
  const response = await withModels({
    user: makeUser("student", studentId),
  });

  assert.equal(response.statusCode, 200);
  const claims = JSON.parse(
    Buffer.from(response.body.token.split(".")[1], "base64url").toString()
  );
  assert.equal(claims.video.room, roomName);
  assert.equal(claims.video.roomJoin, true);
  assert.equal(claims.video.canPublish, false);
  assert.equal(claims.video.canSubscribe, true);
});

test("rejects students without active enrollment and all users before a lecture is live", async () => {
  const unauthorizedStudent = await withModels({
    user: makeUser("student", studentId),
    enrollment: false,
  });
  assert.equal(unauthorizedStudent.statusCode, 403);
  assert.equal(unauthorizedStudent.body.message, "You cannot access this live session");

  const scheduledTeacher = await withModels({
    user: makeUser("teacher", teacherId),
    liveStatus: "scheduled",
  });
  assert.equal(scheduledTeacher.statusCode, 403);
});

test("rejects a teacher who does not own the lecture", async () => {
  const response = await withModels({
    user: makeUser("teacher", studentId),
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.message, "You cannot access this live session");
});
