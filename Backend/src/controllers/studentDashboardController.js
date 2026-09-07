
const Enrollment = require("../models/enrollment");
const Lecture = require("../models/lecture");
const LectureProgress = require("../models/lectureProgress");

const getMyCoursesDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({
      student: studentId,
      status: "active",
    }).populate("course");

    const dashboard = [];

    for (let enr of enrollments) {
      const course = enr.course;

      const totalLectures = await Lecture.countDocuments({
        course: course._id,
      });

      const completedLectures = await LectureProgress.countDocuments({
        student: studentId,
        course: course._id,
        completed: true,
      });

      const lastLecture = await LectureProgress.findOne({
        student: studentId,
        course: course._id,
      })
        .sort({ lastWatchedAt: -1 })
        .populate("lecture", "title order");

      dashboard.push({
        courseId: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        progressPercent:
          totalLectures === 0
            ? 0
            : Math.round((completedLectures / totalLectures) * 100),
        lastWatchedLecture: lastLecture
          ? lastLecture.lecture
          : null,
      });
    }

    return res.status(200).json({ courses: dashboard });
  } catch (err) {
    console.error("DashboardError:", err);
    return res.status(500).json({ message: "Dashboard failed" });
  }
};
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.student._id })
      .populate('course', 'title thumbnail');
    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = { getMyCoursesDashboard ,getMyEnrollments};
