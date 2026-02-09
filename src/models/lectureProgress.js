// models/lectureProgress.js
const mongoose = require("mongoose");

const lectureProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: true,
  },
  watchedDuration: {
    type: Number,
    default:0,//sec
  },
  completed: {
    type: Boolean,
    default: false,
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now,
  },
});

lectureProgressSchema.index(
  { student: 1, lecture: 1 },
  { unique: true }
);

module.exports = mongoose.model("LectureProgress", lectureProgressSchema);
