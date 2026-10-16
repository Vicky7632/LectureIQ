import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveApiUrl,
  resolveSocketUrl,
  syncCourseSubscriptions,
  mergeLiveSessionSnapshot,
  notifyLiveLectureOnce,
  socketClientOptions,
} from "./socketClientConfig.js";

test("uses the frontend hostname for the local credentialed API fallback", () => {
  assert.equal(
    resolveApiUrl({
      isDevelopment: true,
      frontendOrigin: "http://127.0.0.1:5173",
    }),
    "http://127.0.0.1:3000"
  );
});

test("uses credentialed polling for the initial Socket.IO handshake", () => {
  assert.equal(socketClientOptions.withCredentials, true);
  assert.deepEqual(socketClientOptions.transports, ["polling", "websocket"]);
});

test("prefers configured socket and API origins and uses same-origin in production", () => {
  assert.equal(
    resolveSocketUrl({
      configuredSocketUrl: "https://socket.example.test",
      configuredApiUrl: "https://api.example.test",
      isDevelopment: true,
      frontendOrigin: "http://localhost:5173",
    }),
    "https://socket.example.test"
  );
  assert.equal(
    resolveSocketUrl({
      configuredApiUrl: "https://api.example.test",
      isDevelopment: true,
      frontendOrigin: "http://localhost:5173",
    }),
    "https://api.example.test"
  );
  assert.equal(
    resolveApiUrl({
      isDevelopment: false,
      frontendOrigin: "https://lectureiq.example.test",
    }),
    "https://lectureiq.example.test"
  );
});

test("resubscribes authorized courses after disconnect and avoids duplicate subscribe emits", () => {
  const emitted = [];
  const socket = {
    connected: false,
    emit: (...args) => emitted.push(args),
  };
  const subscriptions = new Set(["course-1"]);
  const attempts = new Map();

  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);
  assert.equal(subscriptions.size, 0);
  assert.equal(emitted.length, 0);

  socket.connected = true;
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);

  assert.deepEqual(
    emitted.map(([event, payload]) => [event, payload.courseId]),
    [["course:subscribe", "course-1"]]
  );
  assert.equal(subscriptions.has("course-1"), true);
});

test("retries a course subscription after a denied acknowledgement", () => {
  const emitted = [];
  const socket = {
    connected: true,
    emit: (...args) => emitted.push(args),
  };
  const subscriptions = new Set();
  const attempts = new Map();
  const errors = [];

  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"], (error) =>
    errors.push(error)
  );
  emitted[0][2]({ ok: false, error: "Course access denied" });
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);

  assert.equal(emitted.length, 2);
  assert.deepEqual(errors, ["Course access denied"]);
});

test("ignores an acknowledgement from a pre-reconnect subscription attempt", () => {
  const emitted = [];
  const socket = {
    connected: true,
    emit: (...args) => emitted.push(args),
  };
  const subscriptions = new Set();
  const attempts = new Map();

  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);
  const staleAcknowledgement = emitted[0][2];
  socket.connected = false;
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);
  socket.connected = true;
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);

  staleAcknowledgement({ ok: false, error: "stale rejection" });
  syncCourseSubscriptions(socket, subscriptions, attempts, ["course-1"]);

  assert.equal(emitted.length, 2);
  assert.equal(subscriptions.has("course-1"), true);
});

test("recovers a missed live-start notification from a reconnect snapshot once", () => {
  const knownStatuses = new Map([["lecture-1", "scheduled"]]);
  const notified = [];
  const snapshot = [
    { _id: "lecture-1", title: "Live class", liveStatus: "live" },
  ];
  const notifyStarted = (session) => notified.push(session._id);

  const refreshed = mergeLiveSessionSnapshot(snapshot, knownStatuses, notifyStarted);
  mergeLiveSessionSnapshot(snapshot, knownStatuses, notifyStarted);

  assert.equal(refreshed[0].liveStatus, "live");
  assert.deepEqual(notified, ["lecture-1"]);
});

test("does not regress live status from a stale snapshot or notify for initial snapshot", () => {
  const knownStatuses = new Map([["lecture-1", "ended"]]);
  const notified = [];
  const refreshed = mergeLiveSessionSnapshot(
    [{ _id: "lecture-1", liveStatus: "live" }],
    knownStatuses,
    (session) => notified.push(session._id)
  );
  const initialStatuses = new Map();
  mergeLiveSessionSnapshot(
    [{ _id: "lecture-2", liveStatus: "live" }],
    initialStatuses,
    (session) => notified.push(session._id)
  );

  assert.equal(refreshed[0].liveStatus, "ended");
  assert.deepEqual(notified, []);
});

test("deduplicates repeated start events for one lecture", () => {
  const notifiedLectureIds = new Set();
  const notifications = [];
  const notify = (session) => notifications.push(session.title);
  const session = { lectureId: "lecture-1", title: "Live class" };

  assert.equal(notifyLiveLectureOnce(session, notifiedLectureIds, notify), true);
  assert.equal(notifyLiveLectureOnce(session, notifiedLectureIds, notify), false);
  assert.deepEqual(notifications, ["Live class"]);
});
