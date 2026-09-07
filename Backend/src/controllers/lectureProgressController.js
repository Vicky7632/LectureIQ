
const LectureProgress = require("../models/lectureProgress");
const Enrollment = require("../models/enrollment");

const updateLectureProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { lectureId } = req.params;
    const { watchedDuration, completed } = req.body;

    // enrollment check
    const enrollment = await Enrollment.findOne({
      student: studentId,
      status: "active",
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled" });
    }

    const progress = await LectureProgress.findOneAndUpdate(
      { student: studentId, lecture: lectureId },
      {
        watchedDuration,
        completed,
        lastWatchedAt: new Date(),
        course: enrollment.course,
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
