const Lecture = require("../models/lecture");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const mongoose = require("mongoose");
const cloudinary = require('../config/cloudinary'); 
const { loadAuthorizedLiveLecture } = require("../services/liveLectureAccess");

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
    const { title, description, courseId, scheduledAt } = req.body;

    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      !mongoose.isValidObjectId(courseId)
    ) {
      return res.status(400).json({
        message: "A valid courseId and a title of at least 3 characters are required",
      });
    }

    const scheduledAtMatch =
      typeof scheduledAt === "string"
        ? scheduledAt.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(?:Z|[+-]\d{2}:\d{2})$/
          )
        : null;
    if (!scheduledAtMatch) {
      return res.status(400).json({
        message: "A scheduledAt date with a timezone is required",
      });
    }

    const scheduledDate = new Date(scheduledAt);
    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second,
      milliseconds = "",
    ] = scheduledAtMatch;
    const calendarDate = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(milliseconds.padEnd(3, "0"))
      )
    );
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      calendarDate.getUTCFullYear() !== Number(year) ||
      calendarDate.getUTCMonth() !== Number(month) - 1 ||
      calendarDate.getUTCDate() !== Number(day) ||
      calendarDate.getUTCHours() !== Number(hour) ||
      calendarDate.getUTCMinutes() !== Number(minute) ||
      calendarDate.getUTCSeconds() !== Number(second) ||
      scheduledDate.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        message: "The live lecture must be scheduled for a future time",
      });
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
      description: typeof description === "string" ? description.trim() : "",
      videoUrl: null,
      cloudinaryPublicId: null,
      duration: 0,
      course: courseId,
      order: course.lecturesCount + 1,
      isPreview: false,
      lectureType: "live",
      liveStatus: "scheduled",
      scheduledAt: scheduledDate,
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

    const io = req.app?.get?.("io");
    if (io) {
      io.to(lectureId).emit("lecture:started", {
        lectureId: lecture._id.toString(),
        courseId: lecture.course.toString(),
        title: lecture.title,
        liveStatus: lecture.liveStatus,
        startedAt: lecture.startedAt,
      });
      io.to(`course:${lecture.course.toString()}`).emit("lecture:started", {
        lectureId: lecture._id.toString(),
        courseId: lecture.course.toString(),
        title: lecture.title,
        liveStatus: lecture.liveStatus,
        startedAt: lecture.startedAt,
      });
    }

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
    const { thumbnail } = req.body || {};

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
    const recordingUrl = req.liveRecording?.videoUrl || req.body?.recordingUrl;
    const recordingPublicId = req.liveRecording?.cloudinaryPublicId || req.body?.recordingPublicId;
    if (recordingUrl) {
      lecture.lectureType = "recorded";
      lecture.videoUrl = recordingUrl;
      lecture.cloudinaryPublicId = recordingPublicId || null;
    }

    await lecture.save();

    const io = req.app?.get?.("io");
    if (io) {
      io.to(lectureId).emit("lecture:ended", {
        lectureId: lecture._id.toString(),
        courseId: lecture.course.toString(),
        title: lecture.title,
        liveStatus: lecture.liveStatus,
        endedAt: lecture.endedAt,
      });
      io.to(`course:${lecture.course.toString()}`).emit("lecture:ended", {
        lectureId: lecture._id.toString(),
        courseId: lecture.course.toString(),
        title: lecture.title,
        liveStatus: lecture.liveStatus,
        endedAt: lecture.endedAt,
      });
    }

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

    let query = {
      course: courseId,
      lectureType: "live",
      liveStatus: "scheduled",
    };
    
    if (user.role === "teacher") {
      query.teacher = user._id;
    } else if (user.role === "student") {
      const [course, enrollment] = await Promise.all([
        Course.findOne({ _id: courseId, status: "published" }).select("_id"),
        Enrollment.findOne({
          student: user._id,
          course: courseId,
          status: "active",
        }).select("_id"),
      ]);
      if (!course || !enrollment) {
        return res.status(403).json({ message: "Course access denied" });
      }
      query.liveStatus = { $in: ["scheduled", "live"] };
    }

    const lectures = await Lecture.find(query).sort({
      scheduledAt: 1,
      createdAt: 1,
    });
    res.json({ sessions: lectures });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
const getLectureById = async (req, res) => {
  try {
    const access = await loadAuthorizedLiveLecture(
      req.user,
      req.params.lectureId
    );
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }
    const { lecture } = access;
    return res.json({
      _id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      liveStatus: lecture.liveStatus,
      startedAt: lecture.startedAt,
      endedAt: lecture.endedAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createLecture,startLiveLecture, endLiveLecture,createLiveLecture,getUpcomingLiveLectures,getLectureById};
