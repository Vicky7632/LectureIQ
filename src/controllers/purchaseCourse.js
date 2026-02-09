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
    //console.log("REQ.USER:", req.student);
    const studentId = req.student._id;
    const { courseId } = req.params;
    const existingEnrollment = await Enrollment.findOne({
  student: studentId,
  course: courseId,
});

if (existingEnrollment) {
  return res.status(400).json({
    message: "Already enrolled in this course",
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
    console.error("CreateOrderError:", err);
    return res.status(500).json({ message: "Payment order failed" });
  }
};

const verifyPayment = async (req, res) => {
  try {
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

    const payment = await Payment.findOne({
      providerOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // TEMP update (webhook will finalize)
    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    payment.status = "success";

    await payment.save();

    return res.status(200).json({
      message: "Payment verified, waiting for confirmation",
    });
  } catch (err) {
    console.error("VerifyPaymentError:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};
const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event !== "payment.captured") {
      return res.status(200).json({ status: "ignored" });
    }

    const payment = await Payment.findOne({
      providerOrderId: paymentEntity.order_id,
    });

    if (!payment || payment.status === "success") {
      return res.status(200).json({ status: "already_processed" });
    }

    // FINAL payment update
    payment.status = "success";
    payment.providerPaymentId = paymentEntity.id;
    payment.meta = paymentEntity;

    await payment.save();

    // ACTIVATE enrollment
    await Enrollment.findByIdAndUpdate(payment.enrollment, {
      status: "active",
      paymentStatus: "paid",
      enrolledAt: new Date(),
    });

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("WebhookError:", err);
    return res.status(500).json({ message: "Webhook error" });
  }
};



module.exports = { createOrder,verifyPayment ,razorpayWebhook};
