const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const Lecture = require("../models/lecture");
const lectureRouter = require("../routes/lectureCreate");
const { startLiveLecture, endLiveLecture } = require("./lectureCreation");
const liveRecordingUpload = require("../middleware/liveRecordingUpload");

const teacherId = "teacher-123";
const lectureId = "lecture-123";

const createLecture = (overrides = {}) => ({
  _id: lectureId,
  teacher: { toString: () => overrides.teacherId || teacherId },
  lectureType: "live",
  liveStatus: "scheduled",
  startedAt: null,
  endedAt: null,
  duration: 0,
  save: async function () {
    this.saved = true;
  },
  ...overrides,
});

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

const invokeController = async (controller, lecture, req) => {
  const originalFindById = Lecture.findById;
  Lecture.findById = async () => lecture;
  const res = createResponse();

  try {
    await controller(req, res);
  } finally {
    Lecture.findById = originalFindById;
  }

  return res;
};

const requestFor = (userId = teacherId, body = {}) => ({
  params: { lectureId },
  user: { _id: userId },
  body,
});

test("mounts the live start and end routes at the frontend API paths", () => {
  const liveRoutes = lectureRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      patch: Boolean(layer.route.methods.patch),
    }))
    .filter((route) => route.patch);

  assert.deepEqual(liveRoutes, [
    { path: "/:lectureId/start", patch: true },
    { path: "/:lectureId/end", patch: true },
  ]);
});

test("starts a scheduled live lecture and persists the live state", async () => {
  const lecture = createLecture();
  const response = await invokeController(
    startLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.lecture.liveStatus, "live");
  assert.match(response.body.roomId, /^room_[a-f\d]{16}$/);
  assert.ok(lecture.startedAt instanceof Date);
  assert.equal(lecture.saved, true);
});

test("rejects starting a lecture that is not scheduled", async () => {
  const lecture = createLecture({ liveStatus: "live" });
  const response = await invokeController(
    startLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Lecture cannot be started");
  assert.equal(lecture.saved, undefined);
});

test("rejects starting a live lecture owned by another teacher", async () => {
  const lecture = createLecture({ teacherId: "different-teacher" });
  const response = await invokeController(
    startLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.message, "Unauthorized");
  assert.equal(lecture.liveStatus, "scheduled");
  assert.equal(lecture.saved, undefined);
});

test("ends a live lecture without requiring a recording upload", async () => {
  const lecture = createLecture({
    liveStatus: "live",
    startedAt: new Date(Date.now() - 5000),
  });
  const response = await invokeController(
    endLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.lecture.liveStatus, "ended");
  assert.ok(lecture.endedAt instanceof Date);
  assert.ok(lecture.duration >= 0);
  assert.equal(lecture.saved, true);

  const restartResponse = await invokeController(
    startLiveLecture,
    lecture,
    requestFor()
  );
  assert.equal(restartResponse.statusCode, 400);
  assert.equal(lecture.liveStatus, "ended");
});

test("allows an end request to pass upload middleware without a recording", async () => {
  const req = new PassThrough();
  req.method = "PATCH";
  req.headers = { "content-type": "application/json" };
  req.url = `/${lectureId}/end`;
  req.originalUrl = req.url;
  req.body = { thumbnail: null };

  await new Promise((resolve, reject) => {
    liveRecordingUpload(req, createResponse(), (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  assert.equal(req.liveRecording, undefined);
});

test("attaches an uploaded recording when one is supplied while ending", async () => {
  const lecture = createLecture({ liveStatus: "live" });
  const req = requestFor();
  req.liveRecording = {
    videoUrl: "https://example.invalid/recording.webm",
    cloudinaryPublicId: "recording-id",
  };
  const response = await invokeController(endLiveLecture, lecture, req);

  assert.equal(response.statusCode, 200);
  assert.equal(lecture.liveStatus, "ended");
  assert.equal(lecture.lectureType, "recorded");
  assert.equal(lecture.videoUrl, req.liveRecording.videoUrl);
  assert.equal(lecture.cloudinaryPublicId, req.liveRecording.cloudinaryPublicId);
});

test("rejects ending a lecture that is not live", async () => {
  const lecture = createLecture();
  const response = await invokeController(
    endLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Lecture is not live");
  assert.equal(lecture.saved, undefined);
});

test("rejects ending a live lecture owned by another teacher", async () => {
  const lecture = createLecture({
    teacherId: "different-teacher",
    liveStatus: "live",
  });
  const response = await invokeController(
    endLiveLecture,
    lecture,
    requestFor()
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.message, "Unauthorized");
  assert.equal(lecture.liveStatus, "live");
  assert.equal(lecture.saved, undefined);
});
