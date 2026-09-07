const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created",
      index: true,
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    providerOrderId: {
      type: String,
      index: true,
    },

    providerPaymentId: {
      type: String,
      index: true,
    },

    providerSignature: String, // webhook verification

    meta: {
      type: Object, // gateway raw payload (safe, optional)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

