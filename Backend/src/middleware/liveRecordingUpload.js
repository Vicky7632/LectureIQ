const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const getUploadParams = (req) => ({
  folder: "lectureiq/live_recordings",
  resource_type: "video",
  public_id: `live_${req.params.lectureId}_${Date.now()}`,
  eager_async: true,
});

/* ================= STORAGE ================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: getUploadParams,
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("video/") &&
    (file.mimetype.includes("webm") ||
      file.mimetype.includes("mp4") ||
      file.mimetype.includes("ogg"))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only live recording video files allowed"), false);
  }
};

/* ================= MULTER INSTANCE ================= */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 800 * 1024 * 1024 }, // 800MB live safety
}).single("recording"); // 👈 IMPORTANT: frontend field name

/* ================= FINAL MIDDLEWARE ================= */
const liveRecordingUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("LIVE MULTER ERROR:", err);
      return res.status(400).json({
        message: err.message || "Live recording upload failed",
      });
    }

    if (req.file) {
      req.liveRecording = {
        videoUrl: req.file.path,
        cloudinaryPublicId: req.file.filename,
      };
    }

    next();
  });
};

module.exports = liveRecordingUpload;
module.exports.getUploadParams = getUploadParams;