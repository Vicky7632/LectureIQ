const Razorpay = require("razorpay");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");
const crypto = require("crypto");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    if (!req.student || req.student.role !== "student") {
      return res.status(403).json({ message: "Student access only" });
    }

    const studentId = req.student._id;
    const { courseId } = req.params;
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(200).json({
        message: existingEnrollment.status === "active"
          ? "Already enrolled in this course"
          : "An enrollment or payment is already in progress",
        alreadyEnrolled: existingEnrollment.status === "active",
        enrollment: existingEnrollment,
      });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Course not available" });
    }

    if (!course.isPaid) {
      // FREE COURSE
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        status: "active",
        paymentStatus: "free",
      });

      return res.status(200).json({
        message: "Enrolled in free course",
        enrollmentId: enrollment._id,
      });
    }

    // PAID COURSE → create enrollment first
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: "pending",
      paymentStatus: "pending",
    });

    const order = await razorpay.orders.create({
      amount: course.price * 100,
      currency: "INR",
      receipt: `course_${courseId}_${Date.now()}`,
    });

    await Payment.create({
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      amount: course.price,
      currency: "INR",
      paymentProvider: "razorpay",
      providerOrderId: order.id,
      status: "created",
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    if (err?.code === 11000 && req.student?._id && req.params?.courseId) {
      try {
        const existingEnrollment = await Enrollment.findOne({
          student: req.student._id,
          course: req.params.courseId,
        });
        if (existingEnrollment) {
          return res.status(200).json({
            message: existingEnrollment.status === "active"
              ? "Already enrolled in this course"
              : "An enrollment or payment is already in progress",
            alreadyEnrolled: existingEnrollment.status === "active",
            enrollment: existingEnrollment,
          });
        }
      } catch (lookupError) {
        console.error("CreateOrderDuplicateLookupError:", lookupError);
        return res.status(500).json({ message: "Payment order failed" });
      }
    }
    console.error("CreateOrderError:", err);
    return res.status(500).json({ message: "Payment order failed" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    if (!req.student || req.student.role !== "student") {
      return res.status(403).json({ message: "Student access only" });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const payment = await Payment.findOneAndUpdate(
      {
        providerOrderId: razorpay_order_id,
        paymentProvider: "razorpay",
        student: req.student._id,
        status: { $in: ["created", "success"] },
        $or: [
          { providerPaymentId: null },
          { providerPaymentId: razorpay_payment_id },
        ],
      },
      {
        $set: {
          providerPaymentId: razorpay_payment_id,
          providerSignature: razorpay_signature,
          status: "success",
        },
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found or not eligible" });
    }

    return res.status(200).json({
      message: "Payment verified, waiting for confirmation",
    });
  } catch (err) {
    console.error("VerifyPaymentError:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (
    !Buffer.isBuffer(rawBody) ||
    typeof signature !== "string" ||
    !/^[a-f\d]{64}$/i.test(signature) ||
    !secret
  ) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");

  return (
    receivedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(receivedSignature, expectedSignature)
  );
};

const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!secret) {
      return res.status(503).json({ message: "Webhook verification is unavailable" });
    }
    if (!verifyWebhookSignature(req.body, signature, secret)) {
      return res.status(400).send("Invalid signature");
    }

    let webhook;
    try {
      webhook = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    if (webhook.event !== "payment.captured") {
      return res.status(200).json({ status: "ignored" });
    }

    const paymentEntity = webhook.payload?.payment?.entity;
    if (
      paymentEntity?.status !== "captured" ||
      typeof paymentEntity.id !== "string" ||
      typeof paymentEntity.order_id !== "string" ||
      !Number.isSafeInteger(paymentEntity.amount) ||
      typeof paymentEntity.currency !== "string"
    ) {
      return res.status(400).json({ message: "Invalid captured payment" });
    }

    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id,
      paymentProvider: "razorpay",
    });
    if (!payment) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    if (!["created", "success"].includes(payment.status)) {
      return res.status(409).json({ message: "Payment is not eligible for capture" });
    }

    const expectedAmount =
      typeof payment.amount === "number" ? Math.round(payment.amount * 100) : NaN;
    if (
      !Number.isSafeInteger(expectedAmount) ||
      typeof payment.currency !== "string" ||
      paymentEntity.amount !== expectedAmount ||
      paymentEntity.currency.toUpperCase() !== payment.currency.toUpperCase()
    ) {
      return res.status(400).json({ message: "Payment amount or currency mismatch" });
    }

    if (
      payment.providerPaymentId &&
      payment.providerPaymentId !== paymentEntity.id
    ) {
      return res.status(409).json({ message: "Payment does not match this order" });
    }

    const enrollmentQuery = {
      _id: payment.enrollment,
      student: payment.student,
      course: payment.course,
    };
    let enrollment = await Enrollment.findOne(enrollmentQuery);
    if (!enrollment) {
      return res.status(404).json({ message: "Payment enrollment not found" });
    }
    if (!["pending", "active"].includes(enrollment.status)) {
      return res.status(409).json({ message: "Enrollment is not eligible for activation" });
    }

    const paymentChanged =
      payment.status !== "success" ||
      payment.providerPaymentId !== paymentEntity.id ||
      !payment.meta;
    if (paymentChanged) {
      const paymentUpdate = await Payment.updateOne(
        {
          _id: payment._id,
          paymentProvider: "razorpay",
          providerOrderId: paymentEntity.order_id,
          status: { $in: ["created", "success"] },
          $or: [
            { providerPaymentId: null },
            { providerPaymentId: paymentEntity.id },
          ],
        },
        {
          $set: {
            status: "success",
            providerPaymentId: paymentEntity.id,
            meta: paymentEntity,
          },
        },
      );
      if (!paymentUpdate.matchedCount) {
        return res.status(409).json({ message: "Payment does not match this order" });
      }
    }

    if (enrollment.status === "pending") {
      enrollment = await Enrollment.findOneAndUpdate(
        { ...enrollmentQuery, status: "pending" },
        {
          $set: {
            status: "active",
            paymentStatus: "paid",
            enrolledAt: new Date(),
          },
        },
        { new: true }
      );
    } else if (enrollment.paymentStatus !== "paid") {
      enrollment = await Enrollment.findOneAndUpdate(
        { ...enrollmentQuery, status: "active" },
        { $set: { paymentStatus: "paid" } },
        { new: true }
      );
    }

    if (!enrollment) {
      enrollment = await Enrollment.findOne(enrollmentQuery);
    }
    if (
      !enrollment ||
      enrollment.status !== "active" ||
      enrollment.paymentStatus !== "paid"
    ) {
      return res.status(409).json({ message: "Enrollment could not be activated" });
    }

    return res.status(200).json({
      status: paymentChanged ? "ok" : "already_processed",
    });
  } catch (err) {
    console.error("WebhookError:", err);
    return res.status(500).json({ message: "Webhook error" });
  }
};



module.exports = { createOrder, verifyPayment, razorpayWebhook };
