const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* ===========================STORAGE CONFIG=========================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "lecture-videos",
    resource_type: "video",
    format: "mp4",
    public_id: `lecture_${Date.now()}`,
  }),
});

/* ===========================FILE FILTER=========================== */
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("video/")) {
    return cb(new Error("Only video files are allowed"), false);
  }
  cb(null, true);
};

/* ===========================MULTER INSTANCE=========================== */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).single("video");

/* ===========================FINAL MIDDLEWARE=========================== */
const lectureVideoUpload = (req, res, next) => {
  // FILE UPLOAD
  upload(req, res, (err) => {
    if (err) {
       console.error("MULTER ERROR:", err); 
      return res.status(400).json({
        message: err.message || "Video upload failed",
      });
    }
    
    // Body validation inside callback
    const { title, courseId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({
        message: "title and courseId are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Lecture video is required",
      });
    }

    // ATTACH CLOUDINARY DATA
    req.uploadedVideo = {
      videoUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      duration: req.body.duration || 0, // optional duration sent from frontend
    };

    next();
  });
};

module.exports = lectureVideoUpload;

