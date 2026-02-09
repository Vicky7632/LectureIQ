const Lecture = require("../models/lecture");
const Course = require("../models/course");

const createLecture = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const {
      title,
      description,
      courseId,
      isPreview = false,
      lectureType = "recorded",
      order,
    } = req.body;

    // basic validation
    if (!title || !courseId) {
      return res.status(400).json({
        message: "Title and courseId are required",
      });
    }

    // check course ownership (allow draft & pending)
    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
      status: { $ne: "rejected" },
    });

    if (!course) {
      return res.status(403).json({
        message: "Course not found or access denied",
      });
    }

    // uploaded video check
    if (!req.uploadedVideo) {
      return res.status(400).json({
        message: "Lecture video is required",
      });
    }

    const { videoUrl, cloudinaryPublicId, duration } = req.uploadedVideo;

    // create lecture
    const lecture = await Lecture.create({
      title,
      description,
      videoUrl,
      cloudinaryPublicId,
      duration,
      course: courseId,
      order: order || course.lecturesCount + 1,
      isPreview,
      lectureType,
      liveStatus: lectureType === "live" ? "scheduled" : undefined,
      teacher: teacherId,
    });

    // update course stats
    course.lecturesCount += 1;
    course.totalDuration += duration || 0;
    await course.save();

    return res.status(201).json({
      message: "Lecture created successfully",
      lecture,
    });

  } catch (err) {
    console.error("CreateLectureError:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { createLecture };

