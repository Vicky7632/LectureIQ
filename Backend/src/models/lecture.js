const mongoose = require("mongoose");
const { Schema } = mongoose;

const lectureSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: String,

    videoUrl: String,
    cloudinaryPublicId: String,

    duration: {
      type: Number,
      default: 0
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    order: {
      type: Number,
      required: true
    },

    isPreview: {
      type: Boolean,
      default: false
    },

    lectureType: {
      type: String,
      enum: ["recorded", "live"],
      default: "recorded"
    },

    liveStatus: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled"
    },
    recordingStatus: {
  type: String,
  enum: ["not_started", "processing", "ready", "failed"],
  default: "not_started"
},

recordingDuration: {
  type: Number,
  default: 0
},

recordingSize: {
  type: Number,
  default: 0
},
    liveRoomId: String,
    liveThumbnail: String,
    startedAt: Date,
    endedAt: {
      type: Date,
  default: null
    }
  },
  { timestamps: true }
);

const Lecture = mongoose.model("Lecture", lectureSchema);
module.exports = Lecture;

