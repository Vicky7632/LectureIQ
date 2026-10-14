const express=require('express');
const getRouter=express.Router();
const optionalStudent=require("../middleware/optionalMiddleware");
const studentMiddleware = require("../middleware/studentMiddleware");
const {getPublishedCourses,getCourseById,getCourseLectures,enrollInCourse}=require("../controllers/getCourse");
//for landing page
getRouter.get("/courses",getPublishedCourses);
getRouter.get("/course/:courseId",optionalStudent,getCourseById);
getRouter.get("/course/:courseId/lectures",optionalStudent,getCourseLectures);
getRouter.post("/course/:courseId/enroll",studentMiddleware,enrollInCourse);
module.exports=getRouter;