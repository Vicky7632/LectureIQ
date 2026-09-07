const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* ================= STORAGE CONFIG ================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "course-thumbnails",
    resource_type: "image",
    public_id: `course_${Date.now()}`,
  }),
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

/* ================= MULTER INSTANCE ================= */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("thumbnail");

/* ================= FINAL MIDDLEWARE ================= */
const courseThumbnailUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Thumbnail upload failed",
      });
    }

    if (req.file) {
      req.thumbnailData = {
        thumbnailUrl: req.file.path,
        cloudinaryPublicId: req.file.filename,
      };
    }

    next();
  });
};

module.exports = courseThumbnailUpload;
