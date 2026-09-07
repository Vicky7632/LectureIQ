const express = require("express");
const teacherMiddleware = require("../middleware/teacherMiddleware");
const teacherRouter = express.Router();
const {getTeacherCourses,getCourseStudents,getTeacherDashboardStats,getTeacherCourseLectures}=require("../controllers/teacherDashboard");
//my courses
teacherRouter.get("/my-courses",teacherMiddleware,getTeacherCourses);
// course by id student enroolled in course
teacherRouter.get("/course/:courseId/students",teacherMiddleware,getCourseStudents);
// overall dashboard
teacherRouter.get("/dashboard-stats",teacherMiddleware,getTeacherDashboardStats);
//lecture
teacherRouter.get("/course/:courseId/lectures",teacherMiddleware,getTeacherCourseLectures);

module.exports=teacherRouter;