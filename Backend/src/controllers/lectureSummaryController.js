const mongoose = require("mongoose");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const { summarizeLectureDescription } = require("../services/lectureSummarization");
const { canSummarizeLecture } = require("../utils/lectureSummaryAccess");

const summarizeLecture = async (req, res) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({ message: "Invalid lecture ID" });
  }

  try {
    const lecture = await Lecture.findById(lectureId).select(
      "title description course teacher isPreview"
    );

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const course = await Course.findById(lecture.course).select(
      "teacher status isPaid"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let hasActiveEnrollment = false;
    if (
      req.user.role === "student" &&
      req.user.isEmailVerified &&
      req.user.isActive &&
      course.status === "published" &&
      course.isPaid &&
      !lecture.isPreview
    ) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
        status: "active",
      }).select("_id");
      hasActiveEnrollment = Boolean(enrollment);
    }

    if (
      !canSummarizeLecture({
        user: req.user,
        lecture,
        course,
        hasActiveEnrollment,
      })
    ) {
      return res.status(403).json({ message: "You cannot access this lecture" });
    }

    const summary = await summarizeLectureDescription({
      title: lecture.title,
      description: lecture.description,
    });

    return res.status(200).json({
      lectureId: lecture._id,
      source: "description",
      summary,
    });
  } catch (error) {
    if (Number.isInteger(error.statusCode)) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("LectureSummaryError:", error);
    return res.status(500).json({ message: "Failed to summarize lecture" });
  }
};

module.exports = { summarizeLecture };
