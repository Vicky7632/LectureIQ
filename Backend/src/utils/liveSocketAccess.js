const MAX_CHAT_MESSAGE_LENGTH = 1000;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const isValidLectureId = (lectureId) =>
  typeof lectureId === "string" && OBJECT_ID_PATTERN.test(lectureId);

const isSocketInLectureRoom = (socketRooms, lectureId) =>
  isValidLectureId(lectureId) &&
  socketRooms &&
  typeof socketRooms.has === "function" &&
  socketRooms.has(lectureId);

const parseChatMessage = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Invalid message payload" };
  }

  if (!isValidLectureId(payload.lectureId)) {
    return { error: "A valid lectureId is required" };
  }

  if (typeof payload.text !== "string") {
    return { error: "Message text is required" };
  }

  const text = payload.text.trim();
  if (!text) {
    return { error: "Message text cannot be empty" };
  }
  if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      error: `Message text must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer`,
    };
  }

  return { value: { lectureId: payload.lectureId, text } };
};

const canJoinLiveLecture = ({
  user,
  lecture,
  course,
  hasActiveEnrollment = false,
}) => {
  if (!user?.isEmailVerified || !user?.isActive) {
    return false;
  }

  if (lecture?.lectureType !== "live" || lecture.liveStatus !== "live") {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const userId = user._id.toString();
  if (user.role === "teacher") {
    return (
      course.teacher.toString() === userId &&
      lecture.teacher.toString() === userId
    );
  }

  return (
    user.role === "student" &&
    course.status === "published" &&
    hasActiveEnrollment
  );
};

module.exports = {
  MAX_CHAT_MESSAGE_LENGTH,
  canJoinLiveLecture,
  isValidLectureId,
  isSocketInLectureRoom,
  parseChatMessage,
};
