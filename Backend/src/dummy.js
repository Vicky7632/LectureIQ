const express=require("express");
const app=express();
const http = require("http");
require('dotenv').config();
const cookieParser = require('cookie-parser');
const main=require('./config/db');
const redisClient=require('./config/redis');
const authRouter=require('./routes/studentAuth');
const courseRouter=require('./routes/courseCreate');
const lectureRouter=require('./routes/lectureCreate');
const getRouter=require('./routes/courseGet');
const studentRouter=require('./routes/studentRoutes');
const paymentRouter=require('./routes/paymentSystem');
app.use(express.json());
app.use(cookieParser());
app.use('/auth',authRouter);
app.use('/course',courseRouter);
app.use('/lecture',lectureRouter);
app.use('/user',getRouter);
app.use('/payment',paymentRouter);
app.use('/student',studentRouter);




const initializeConnection = async () => {
    try {
        await Promise.all([
            redisClient.connect(),
            main()
        ]);

        console.log(" Redis + MongoDB Connected");

        app.listen(process.env.PORT, () => {
            console.log(` Server running on port ${process.env.PORT}`);
        });

    } catch (err) {
        console.error(" Error:", err);
        process.exit(1);
    }
};

initializeConnection();


//
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // new verification token
    const emailVerifyToken = jwt.sign(
      {
        _id: student._id,
        type: "EMAIL_VERIFY",
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    const verifyLink = `${process.env.BACKEND_URL}/verify-email?token=${emailVerifyToken}`;

    await sendEmail(
      student.email,
      "Verify your LectureIQ account",
      `
        <p>Hi ${student.firstName},</p>
        <p>Please verify your email.</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>Valid for 24 hours.</p>
      `
    );

    return res.status(200).json({
      message: "Verification email resent successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};