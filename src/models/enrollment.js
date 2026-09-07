const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "pending", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["free", "paid", "pending", "failed"],
      default: "pending",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date, // future: subscriptions / time-bound access
    },
  },
  { timestamps: true }
);

// one student → one course → one enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);

