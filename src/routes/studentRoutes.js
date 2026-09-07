// routes/studentRoutes.js
const express = require("express");
const studentMiddleware = require("../middleware/studentMiddleware");
const {getMyCoursesDashboard} = require("../controllers/studentDashboardController");

const {updateLectureProgress} = require("../controllers/lectureProgressController");

const studentRouter = express.Router();

studentRouter.get("/my-courses", studentMiddleware, getMyCoursesDashboard);
studentRouter.post( "/lecture/:lectureId/progress", studentMiddleware,updateLectureProgress);

module.exports = studentRouter;
