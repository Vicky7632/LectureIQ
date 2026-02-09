const express=require('express');
const lectureRouter=express.Router();
const teacherMiddleware = require("../middleware/teacherMiddleware");
const {createLecture}=require("../controllers/lectureCreation");
const lectureVideoUpload=require("../middleware/lectureVideoUpload")

lectureRouter.post('/create',teacherMiddleware,lectureVideoUpload,createLecture);

module.exports=lectureRouter;