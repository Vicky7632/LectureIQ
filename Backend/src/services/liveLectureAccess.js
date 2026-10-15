const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const {
  canJoinLiveLecture,
  isValidLectureId,
} = require("../utils/liveSocketAccess");

const loadAuthorizedLiveLecture = async (user, lectureId) => {
  if (!isValidLectureId(lectureId)) {
    return { status: 400, error: "A valid lectureId is required" };
  }

  if (!user?.isEmailVerified || !user?.isActive) {
    return { status: 403, error: "An active, verified account is required" };
  }

  const lecture = await Lecture.findById(lectureId).select(
    "title description course teacher lectureType liveStatus liveRoomId startedAt endedAt"
  );
  if (!lecture) {
    return { status: 404, error: "Live lecture not found" };
  }

  const course = await Course.findById(lecture.course).select(
    "title teacher status isPaid"
  );
  if (!course) {
    return { status: 404, error: "Course not found" };
  }

  let hasActiveEnrollment = false;
  if (user.role === "student") {
    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id,
      status: "active",
    }).select("_id");
    hasActiveEnrollment = Boolean(enrollment);
  }

  if (!canJoinLiveLecture({ user, lecture, course, hasActiveEnrollment })) {
    return { status: 403, error: "You cannot access this live session" };
  }

  return { lecture, course };
};

module.exports = { loadAuthorizedLiveLecture };
