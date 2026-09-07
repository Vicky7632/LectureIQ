const Lecture = require("../models/lecture");
const Course = require("../models/course");
const cloudinary = require('../config/cloudinary'); 

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
const createLiveLecture = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, description, courseId, order } = req.body;

    // basic validation
    if (!title || !courseId) {
      return res.status(400).json({ message: "Title and courseId are required" });
    }

    // course ownership check
    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
      status: { $ne: "rejected" },
    });

    if (!course) {
      return res.status(403).json({ message: "Course not found or access denied" });
    }

    // create live lecture – no video fields
    const lecture = await Lecture.create({
      title,
      description,
      videoUrl: null,
      cloudinaryPublicId: null,
      duration: 0,
      course: courseId,
      order: order || course.lecturesCount + 1,
      isPreview: false,
      lectureType: "live",
      liveStatus: "scheduled",
      teacher: teacherId,
    });

    // update course stats – sirf lecturesCount badhao, totalDuration nahi
    course.lecturesCount += 1;
    await course.save();

    return res.status(201).json({
      message: "Live lecture scheduled successfully",
      lecture,
    });

  } catch (err) {
    console.error("CreateLiveLectureError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const startLiveLecture = async (req, res) => {
 const crypto = require("crypto");
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture)
      return res.status(404).json({ message: "Lecture not found" });

    if (lecture.lectureType !== "live")
      return res.status(400).json({ message: "Not a live lecture" });

    // 🔥 Important: Only scheduled lecture can start
    if (lecture.liveStatus !== "scheduled")
      return res.status(400).json({ message: "Lecture cannot be started" });

    if (lecture.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    /* ===========================
       START LIVE SESSION
    ============================ */
    lecture.liveStatus = "live";
    lecture.startedAt = new Date();

    // 🔐 Better random room id
    lecture.liveRoomId = `room_${crypto.randomBytes(8).toString("hex")}`;

    await lecture.save();

    res.status(200).json({
      message: "Live session started",
      roomId: lecture.liveRoomId,
      lecture,
    });

  } catch (err) {
    console.error("StartLiveError:", err);
    res.status(500).json({ message: "Start live failed" });
  }
};
const endLiveLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { thumbnail, recordingUrl, recordingPublicId } = req.body;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture)
      return res.status(404).json({ message: "Lecture not found" });

    if (lecture.lectureType !== "live")
      return res.status(400).json({ message: "Not a live lecture" });

    if (lecture.liveStatus !== "live")
      return res.status(400).json({ message: "Lecture is not live" });

    if (lecture.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    /* ===========================
       1️⃣ END LIVE SESSION
    ============================ */
    lecture.liveStatus = "ended";
    lecture.endedAt = new Date();

    // Safe duration calculation
    if (lecture.startedAt) {
      lecture.duration = Math.floor(
        (lecture.endedAt - lecture.startedAt) / 1000
      );
    } else {
      lecture.duration = 0;
    }

    /* ===========================
       2️⃣ UPLOAD THUMBNAIL (Optional)
    ============================ */
    if (thumbnail) {
      try {
        const uploadResult = await cloudinary.uploader.upload(thumbnail, {
          folder: `lectureiq/live_thumbnails/${lectureId}`,
          resource_type: "image",
        });

        lecture.liveThumbnail = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Thumbnail upload failed:", uploadErr);
      }
    }

    /* ===========================
       3️⃣ CONVERT LIVE → RECORDED
    ============================ */
    if (recordingUrl) {
      lecture.lectureType = "recorded";
      lecture.videoUrl = recordingUrl;
      lecture.cloudinaryPublicId = recordingPublicId || null;
    }

    await lecture.save();

    res.status(200).json({
      message: "Live session ended and saved successfully",
      lecture,
    });

  } catch (err) {
    console.error("EndLiveLectureError:", err);
    res.status(500).json({ message: "End live failed" });
  }
};
// const getUpcomingLiveLectures = async (req, res) => {
//   try {
//     const { courseId } = req.params;
    
//     const lectures = await Lecture.find({
//       course: courseId,
//       lectureType: "live",
//       liveStatus: "scheduled",
//     }).sort({ scheduledTime: 1 }); // upcoming first

//     res.json({ sessions: lectures });
//   } catch (err) {
//     console.error("GetUpcomingLiveLecturesError:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
const getUpcomingLiveLectures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user; // authMiddleware se aaya

    let query = { course: courseId, lectureType: 'live', liveStatus: 'scheduled' };
    
    // Teacher ke liye sirf apne courses ke lectures
    if (user.role === 'teacher') {
      query.teacher = user._id;
    }

    const lectures = await Lecture.find(query).sort({ scheduledTime: 1 });
    res.json({ sessions: lectures });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId)
      .populate('course', 'title')
      .populate('teacher', 'firstName lastName');
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createLecture,startLiveLecture, endLiveLecture,createLiveLecture,getUpcomingLiveLectures,getLectureById};

