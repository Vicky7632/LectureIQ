const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const lectureRouter = require("../routes/lectureCreate");
const {
  createLiveLecture,
  getUpcomingLiveLectures,
  startLiveLecture,
  endLiveLecture,
} = require("./lectureCreation");
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
  assert.ok(
    lectureRouter.stack.some(
      (layer) =>
        layer.route?.path === "/:lectureId/livekit-token" &&
        layer.route.methods.get
    )
  );
  assert.ok(
    lectureRouter.stack.some(
      (layer) =>
        layer.route?.path === "/create-live" &&
        layer.route.methods.post &&
        layer.route.stack[0].handle ===
          require("../middleware/teacherMiddleware")
    )
  );
});

const invokeCreateLiveLecture = async ({
  body = {},
  course = {
    _id: "507f1f77bcf86cd799439011",
    lecturesCount: 3,
    save: async function () {
      this.saved = true;
    },
  },
  createError,
} = {}) => {
  const originalCourseFindOne = Course.findOne;
  const originalLectureCreate = Lecture.create;
  let courseQuery;
  let lectureData;
  Course.findOne = async (query) => {
    courseQuery = query;
    return course;
  };
  Lecture.create = async (data) => {
    lectureData = data;
    if (createError) throw createError;
    return { _id: "507f1f77bcf86cd799439099", ...data };
  };
  const res = createResponse();

  try {
    await createLiveLecture(
      {
        user: { _id: teacherId },
        body: {
          courseId: "507f1f77bcf86cd799439011",
          title: "Weekly live class",
          scheduledAt: new Date(Date.now() + 60_000).toISOString(),
          ...body,
        },
      },
      res
    );
    return { res, courseQuery, lectureData, course };
  } finally {
    Course.findOne = originalCourseFindOne;
    Lecture.create = originalLectureCreate;
  }
};

test("creates an owned live lecture with a future timezone-aware schedule", async () => {
  const scheduledAt = new Date(Date.now() + 60_000).toISOString();
  const { res, courseQuery, lectureData, course } =
    await invokeCreateLiveLecture({
      body: { scheduledAt, order: 1 },
    });

  assert.deepEqual(courseQuery, {
    _id: "507f1f77bcf86cd799439011",
    teacher: teacherId,
    status: { $ne: "rejected" },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.lecture.liveStatus, "scheduled");
  assert.equal(res.body.lecture.lectureType, "live");
  assert.equal(lectureData.scheduledAt.toISOString(), scheduledAt);
  assert.equal(lectureData.order, 4);
  assert.equal(course.lecturesCount, 4);
  assert.equal(course.saved, true);
});

test("persists a non-UTC schedule as the equivalent absolute time", async () => {
  const expectedDate = new Date(Date.now() + 60_000);
  const localClock = new Date(
    expectedDate.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000
  )
    .toISOString()
    .replace("Z", "+05:30");
  const { res, lectureData } = await invokeCreateLiveLecture({
    body: { scheduledAt: localClock },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(lectureData.scheduledAt.getTime(), expectedDate.getTime());
});

test("rejects missing, malformed, invalid-calendar, and past schedule times", async () => {
  let courseQueried = false;
  const originalCourseFindOne = Course.findOne;
  Course.findOne = async () => {
    courseQueried = true;
    return null;
  };
  const invalidTimes = [
    undefined,
    "not-a-date",
    "2030-02-30T14:30:00Z",
    "2030-01-01T10:00:00",
    "2000-01-01T10:00:00Z",
  ];

  try {
    for (const scheduledAt of invalidTimes) {
      const res = createResponse();
      await createLiveLecture(
        {
          user: { _id: teacherId },
          body: {
            courseId: "507f1f77bcf86cd799439011",
            title: "Weekly live class",
            scheduledAt,
          },
        },
        res
      );
      assert.equal(res.statusCode, 400);
    }
    assert.equal(courseQueried, false);
  } finally {
    Course.findOne = originalCourseFindOne;
  }
});

test("rejects invalid course IDs and short titles before database access", async () => {
  const originalCourseFindOne = Course.findOne;
  Course.findOne = () => {
    assert.fail("Invalid input must be rejected before course lookup");
  };
  const validSchedule = new Date(Date.now() + 60_000).toISOString();

  try {
    for (const body of [
      {
        courseId: "invalid-course",
        title: "Weekly live class",
        scheduledAt: validSchedule,
      },
      {
        courseId: "507f1f77bcf86cd799439011",
        title: "  ",
        scheduledAt: validSchedule,
      },
    ]) {
      const res = createResponse();
      await createLiveLecture(
        { user: { _id: teacherId }, body },
        res
      );
      assert.equal(res.statusCode, 400);
    }
  } finally {
    Course.findOne = originalCourseFindOne;
  }
});

test("does not create a live lecture for a course not owned by the teacher", async () => {
  const originalCourseFindOne = Course.findOne;
  const originalLectureCreate = Lecture.create;
  Course.findOne = async (query) => {
    assert.equal(String(query.teacher), teacherId);
    return null;
  };
  Lecture.create = () => {
    assert.fail("Lecture must not be created for another teacher's course");
  };
  const res = createResponse();

  try {
    await createLiveLecture(
      {
        user: { _id: teacherId },
        body: {
          courseId: "507f1f77bcf86cd799439011",
          title: "Weekly live class",
          scheduledAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
      res
    );
    assert.equal(res.statusCode, 403);
  } finally {
    Course.findOne = originalCourseFindOne;
    Lecture.create = originalLectureCreate;
  }
});

test("returns a server error when live lecture persistence fails", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const { res } = await invokeCreateLiveLecture({
      createError: new Error("database unavailable"),
    });
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Internal server error");
  } finally {
    console.error = originalConsoleError;
  }
});

test("returns scheduled and live sessions to enrolled students ordered by scheduled time", async () => {
  const originalCourseFindOne = Course.findOne;
  const originalEnrollmentFindOne = Enrollment.findOne;
  const originalLectureFind = Lecture.find;
  const scheduledAt = new Date(Date.now() + 60_000);
  let lectureQuery;
  let sortQuery;
  Course.findOne = () => ({
    select: async () => ({ _id: "507f1f77bcf86cd799439011" }),
  });
  Enrollment.findOne = () => ({
    select: async () => ({ _id: "507f1f77bcf86cd799439055" }),
  });
  Lecture.find = (query) => {
    lectureQuery = query;
    return {
      sort: async (sort) => {
        sortQuery = sort;
        return [{ _id: "lecture-1", scheduledAt, liveStatus: "scheduled" }];
      },
    };
  };
  const res = createResponse();

  try {
    await getUpcomingLiveLectures(
      {
        params: { courseId: "507f1f77bcf86cd799439011" },
        user: {
          _id: "507f1f77bcf86cd799439012",
          role: "student",
        },
      },
      res
    );

    assert.deepEqual(lectureQuery.liveStatus, { $in: ["scheduled", "live"] });
    assert.deepEqual(sortQuery, { scheduledAt: 1, createdAt: 1 });
    assert.equal(res.body.sessions[0].scheduledAt, scheduledAt);
  } finally {
    Course.findOne = originalCourseFindOne;
    Enrollment.findOne = originalEnrollmentFindOne;
    Lecture.find = originalLectureFind;
  }
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

test("emits lecture start and end events to the lecture and course rooms", async () => {
  const lecture = createLecture({
    _id: "507f1f77bcf86cd799439011",
    course: "507f1f77bcf86cd799439022",
    title: "React live session",
  });
  const events = {};
  const io = {
    to: (room) => ({
      emit: (eventName, payload) => {
        events[`${room}:${eventName}`] = payload;
      },
    }),
  };
  const req = {
    ...requestFor(),
    app: { get: (name) => (name === "io" ? io : undefined) },
  };
  const lectureRoomName = req.params.lectureId;

  const startedResponse = await invokeController(startLiveLecture, lecture, req);
  assert.equal(startedResponse.statusCode, 200);
  assert.equal(
    events[`${lectureRoomName}:lecture:started`]?.lectureId,
    lecture._id.toString()
  );
  assert.equal(
    events[`course:${lecture.course.toString()}:lecture:started`]?.courseId,
    lecture.course.toString()
  );

  const endedResponse = await invokeController(
    endLiveLecture,
    { ...lecture, liveStatus: "live", startedAt: new Date() },
    req
  );
  assert.equal(endedResponse.statusCode, 200);
  assert.equal(
    events[`${lectureRoomName}:lecture:ended`]?.lectureId,
    lecture._id.toString()
  );
  assert.equal(
    events[`course:${lecture.course.toString()}:lecture:ended`]?.courseId,
    lecture.course.toString()
  );
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
