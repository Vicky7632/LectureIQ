export const resolveApiUrl = ({
  configuredApiUrl,
  isDevelopment,
  frontendOrigin,
}) => {
  if (configuredApiUrl) return configuredApiUrl;
  if (!isDevelopment) return frontendOrigin;

  const localApiUrl = new URL(frontendOrigin);
  localApiUrl.protocol = "http:";
  localApiUrl.port = "3000";
  return localApiUrl.origin;
};

export const resolveSocketUrl = ({
  configuredSocketUrl,
  configuredApiUrl,
  isDevelopment,
  frontendOrigin,
}) =>
  configuredSocketUrl ||
  resolveApiUrl({ configuredApiUrl, isDevelopment, frontendOrigin });

export const syncCourseSubscriptions = (
  socket,
  subscribedCourses,
  subscriptionAttempts,
  courseIds,
  onError = () => {}
) => {
  if (!socket?.connected) {
    subscribedCourses.clear();
    subscriptionAttempts.clear();
    return;
  }

  const desiredCourses = new Set(courseIds);
  for (const courseId of subscribedCourses) {
    if (!desiredCourses.has(courseId)) {
      socket.emit("course:unsubscribe", { courseId });
      subscribedCourses.delete(courseId);
      subscriptionAttempts.delete(courseId);
    }
  }

  for (const courseId of desiredCourses) {
    if (subscribedCourses.has(courseId)) continue;

    const attempt = {};
    subscriptionAttempts.set(courseId, attempt);
    subscribedCourses.add(courseId);
    socket.emit("course:subscribe", { courseId }, (response) => {
      if (subscriptionAttempts.get(courseId) !== attempt) return;
      if (!response?.ok) {
        subscribedCourses.delete(courseId);
        subscriptionAttempts.delete(courseId);
        onError(response?.error);
      } else {
        subscriptionAttempts.delete(courseId);
      }
    });
  }
};

const liveStatusPriority = {
  scheduled: 0,
  live: 1,
  ended: 2,
};

export const mergeLiveSessionSnapshot = (
  sessions,
  knownStatuses,
  notifyStarted = () => {}
) =>
  sessions.map((session) => {
    const id = String(session._id);
    const previousStatus = knownStatuses.get(id);
    const currentStatus = session.liveStatus;
    const effectiveStatus =
      (liveStatusPriority[previousStatus] ?? -1) >
      (liveStatusPriority[currentStatus] ?? -1)
        ? previousStatus
        : currentStatus;

    if (
      previousStatus !== undefined &&
      effectiveStatus === "live" &&
      previousStatus !== "live"
    ) {
      notifyStarted(session);
    }
    knownStatuses.set(id, effectiveStatus);
    return effectiveStatus === currentStatus
      ? session
      : { ...session, liveStatus: effectiveStatus };
  });

export const notifyLiveLectureOnce = (
  session,
  notifiedLectureIds,
  notify
) => {
  const lectureId = String(session._id || session.lectureId || "");
  if (!lectureId || notifiedLectureIds.has(lectureId)) return false;
  notifiedLectureIds.add(lectureId);
  notify(session);
  return true;
};

export const socketClientOptions = {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};
