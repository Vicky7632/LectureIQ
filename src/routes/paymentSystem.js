const express = require("express");
const paymentRouter = express.Router();

const studentMiddleware = require("../middleware/studentMiddleware");

const { createOrder, verifyPayment,razorpayWebhook } = require("../controllers/purchaseCourse");

/**
 * =========================
 * STUDENT PAYMENT ROUTES
 * =========================
 */

// Create payment order for a course
paymentRouter.post("/courses/:courseId/order",studentMiddleware,createOrder);

// Verify payment (client-side callback)
paymentRouter.post( "/verify/razorpay",studentMiddleware,verifyPayment);

/**
 * =========================
 * WEBHOOKS (NO AUTH)
 * =========================
 */

// Razorpay webhook (FINAL authority)
paymentRouter.post( "/webhooks/razorpay",express.raw({ type: "application/json" }),razorpayWebhook);

module.exports = paymentRouter;
