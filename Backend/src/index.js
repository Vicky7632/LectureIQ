// src/index.js
const express = require("express");
const http = require("http");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// DB + Redis
const main = require("./config/db");
const redisClient = require("./config/redis");


// Routers
const authRouter = require("./routes/studentAuth");
const courseRouter = require("./routes/courseCreate");
const lectureRouter = require("./routes/lectureCreate");
const getRouter = require("./routes/courseGet");
const studentRouter = require("./routes/studentRoutes");
const {
  paymentRouter,
  mountPaymentWebhook,
} = require("./routes/paymentSystem");
const adminRouter = require("./routes/adminRoutes");
const teacherRouter = require("./routes/teacherRoutes");
const profileRouter = require("./routes/profileRoutes");
const cors=require('cors');
//using cors

// Socket
const { initSocket } = require("./socket");

const app = express();
mountPaymentWebhook(app);
app.use(express.json());
app.use(cors({
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean),
    credentials:true
}))
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
app.use("/course", courseRouter);
app.use("/lecture", lectureRouter);
app.use("/user", getRouter);
app.use("/payment", paymentRouter);
app.use("/student", studentRouter);
app.use("/admin", adminRouter);
app.use("/teacher", teacherRouter);
app.use("/profile", profileRouter);

const initializeConnection = async () => {
  try {
    await Promise.all([redisClient.connect(), main()]);
    console.log("Redis + MongoDB Connected");

    const server = http.createServer(app);

    // Socket init AFTER server is created
    const io = initSocket(server);
    app.set("io", io);

    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

initializeConnection();
