const canSummarizeLecture = ({
  user,
  lecture,
  course,
  hasActiveEnrollment = false,
}) => {
  if (!user.isEmailVerified || !user.isActive) {
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

  if (user.role !== "student" || course.status !== "published") {
    return false;
  }

  return !course.isPaid || lecture.isPreview || hasActiveEnrollment;
};

module.exports = { canSummarizeLecture };
