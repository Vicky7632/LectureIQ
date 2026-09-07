const express=require('express');
const courseRouter=express.Router();
const teacherMiddleware = require("../middleware/teacherMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { createCourse ,submitCourseForReview,adminRejectCourse, adminApproveCourse,editCourse} = require("../controllers/courseCreation");
const {getPublishedCourses}=require("../controllers/getCourse");
const studentMiddleware = require('../middleware/studentMiddleware');
const courseThumbnailUpload = require("../middleware/courseThumbnailUpload");


courseRouter.post('/create',teacherMiddleware,courseThumbnailUpload,createCourse);
courseRouter.patch("/admin/approve/:courseId", adminMiddleware,adminApproveCourse);
courseRouter.patch("/submit/:courseId",teacherMiddleware,submitCourseForReview);
courseRouter.patch("/course/reject/:courseId",adminMiddleware,adminRejectCourse);
courseRouter.patch( "/edit/:courseId",teacherMiddleware,editCourse);
module.exports=courseRouter;