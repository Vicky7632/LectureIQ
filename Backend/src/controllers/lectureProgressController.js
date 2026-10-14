
const mongoose = require("mongoose");
const LectureProgress = require("../models/lectureProgress");
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");

const updateLectureProgress = async (req, res) => {
  try {
    const student = req.student;
    if (!student) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (student.role !== "student") {
      return res.status(403).json({ message: "Student access only" });
    }

    const { lectureId } = req.params;
    if (!mongoose.isValidObjectId(lectureId)) {
      return res.status(400).json({ message: "Invalid lecture ID" });
    }

    const { watchedDuration, completed } = req.body || {};
    if (
      typeof watchedDuration !== "number" ||
      !Number.isFinite(watchedDuration) ||
      watchedDuration < 0 ||
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({ message: "Invalid lecture progress" });
    }

    const lecture = await Lecture.findById(lectureId).select("course");
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: lecture.course,
      status: "active",
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled" });
    }

    const progress = await LectureProgress.findOneAndUpdate(
      { student: student._id, lecture: lectureId },
      {
        watchedDuration,
        completed,
        lastWatchedAt: new Date(),
        course: lecture.course,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Progress updated",
      progress,
    });
  } catch (err) {
    console.error("ProgressError:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { updateLectureProgress };
