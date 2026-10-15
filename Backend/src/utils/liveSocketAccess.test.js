const assert = require("node:assert/strict");
const test = require("node:test");
const {
  canJoinLiveLecture,
  isValidLectureId,
  isSocketInLectureRoom,
  parseChatMessage,
} = require("./liveSocketAccess");

const lectureId = "507f1f77bcf86cd799439011";
const teacherId = "507f191e810c19729de860ea";
const studentId = "507f1f77bcf86cd799439012";
const lecture = {
  teacher: teacherId,
  lectureType: "live",
  liveStatus: "live",
};
const course = {
  teacher: teacherId,
  status: "published",
  isPaid: true,
};
const user = (role, id, overrides = {}) => ({
  _id: id,
  role,
  isEmailVerified: true,
  isActive: true,
  ...overrides,
});

test("accepts a valid trimmed message and excludes client identity fields", () => {
  const result = parseChatMessage({
    lectureId,
    text: "  Hello class  ",
    userId: "forged-user-id",
    senderName: "Forged name",
    role: "admin",
  });

  assert.deepEqual(result, {
    value: { lectureId, text: "Hello class" },
  });
  assert.equal(isValidLectureId(lectureId), true);
  assert.equal(
    isSocketInLectureRoom(new Set(["socket-id", lectureId]), lectureId),
    true
  );
  assert.equal(isSocketInLectureRoom(new Set(["socket-id"]), lectureId), false);
});

test("rejects missing room IDs, empty text, non-text payloads, and overlong messages", () => {
  assert.match(parseChatMessage({ text: "hello" }).error, /lectureId/);
  assert.match(parseChatMessage({ lectureId, text: " \n " }).error, /empty/);
  assert.match(parseChatMessage({ lectureId, text: 7 }).error, /required/);
  assert.match(
    parseChatMessage({ lectureId, text: "x".repeat(1001) }).error,
    /1000 characters/
  );
  assert.match(parseChatMessage(null).error, /payload/);
  assert.equal(isValidLectureId("lecture-room"), false);
});

test("allows only the owner, active enrolled students, and active admins into live rooms", () => {
  assert.equal(
    canJoinLiveLecture({
      user: user("teacher", teacherId),
      lecture,
      course,
    }),
    true
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("teacher", studentId),
      lecture,
      course,
    }),
    false
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("student", studentId),
      lecture,
      course,
      hasActiveEnrollment: true,
    }),
    true
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("student", studentId),
      lecture,
      course,
      hasActiveEnrollment: false,
    }),
    false
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("admin", "admin-id"),
      lecture,
      course,
    }),
    true
  );
});

test("rejects inactive users and scheduled or ended lectures", () => {
  assert.equal(
    canJoinLiveLecture({
      user: user("student", studentId, { isActive: false }),
      lecture,
      course,
      hasActiveEnrollment: true,
    }),
    false
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("student", studentId),
      lecture: { ...lecture, liveStatus: "scheduled" },
      course,
      hasActiveEnrollment: true,
    }),
    false
  );
  assert.equal(
    canJoinLiveLecture({
      user: user("student", studentId),
      lecture: { ...lecture, liveStatus: "ended" },
      course,
      hasActiveEnrollment: true,
    }),
    false
  );
});
