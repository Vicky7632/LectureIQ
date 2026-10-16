const express = require("express");
const paymentRouter = express.Router();
const paymentWebhookRouter = express.Router();

const studentMiddleware = require("../middleware/studentMiddleware");
const {
  createOrder,
  verifyPayment,
  razorpayWebhook,
} = require("../controllers/purchaseCourse");

const mountPaymentWebhook = (app) => {
  app.use("/payment/webhooks/razorpay", paymentWebhookRouter);
};

/**
 * =========================
 * STUDENT PAYMENT ROUTES
 * =========================
 */

// Create payment order for a course
paymentRouter.post("/courses/:courseId/order", studentMiddleware, createOrder);

// Verify payment (client-side callback)
paymentRouter.post("/verify/razorpay", studentMiddleware, verifyPayment);

/**
 * =========================
 * WEBHOOKS (NO AUTH)
 * =========================
 */

// Parse the raw body before the global JSON parser so signatures use exact request bytes.
paymentWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

module.exports = { paymentRouter, paymentWebhookRouter, mountPaymentWebhook };
