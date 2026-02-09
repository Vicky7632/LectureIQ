const express=require('express');
const getRouter=express.Router();
const optionalStudent=require("../middleware/optionalMiddleware");
const {getPublishedCourses,getCourseById,getCourseLectures}=require("../controllers/getCourse");
// for landing page
getRouter.get("/courses",getPublishedCourses);
getRouter.get("/course/:courseId",optionalStudent,getCourseById);
getRouter.get("/course/:courseId/lectures",optionalStudent,getCourseLectures);
module.exports=getRouter;