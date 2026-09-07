// routes/studentRoutes.js
const express = require("express");
const studentMiddleware = require("../middleware/studentMiddleware");
const {getMyCoursesDashboard,getMyEnrollments} = require("../controllers/studentDashboardController");

const {updateLectureProgress} = require("../controllers/lectureProgressController");

const studentRouter = express.Router();

studentRouter.get("/my-courses", studentMiddleware, getMyCoursesDashboard);
studentRouter.post( "/lecture/:lectureId/progress", studentMiddleware,updateLectureProgress);
studentRouter.get('/enrollments', studentMiddleware, getMyEnrollments);

module.exports = studentRouter;
