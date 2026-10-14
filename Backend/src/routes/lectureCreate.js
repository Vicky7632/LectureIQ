const express=require('express');
const lectureRouter=express.Router();
const teacherMiddleware = require("../middleware/teacherMiddleware");
const {createLecture, createLiveLecture,startLiveLecture,endLiveLecture,getUpcomingLiveLectures,getLectureById}=require("../controllers/lectureCreation");
const { summarizeLecture } = require("../controllers/lectureSummaryController");
const lectureVideoUpload=require("../middleware/lectureVideoUpload");
const studentMiddleware = require('../middleware/studentMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const liveRecordingUpload = require('../middleware/liveRecordingUpload');


lectureRouter.post('/create',teacherMiddleware,lectureVideoUpload,createLecture);
lectureRouter.post('/create-live', teacherMiddleware, createLiveLecture);
lectureRouter.patch('/:lectureId/start',teacherMiddleware,startLiveLecture);
lectureRouter.patch('/:lectureId/end',teacherMiddleware,liveRecordingUpload,endLiveLecture);
// Get upcoming live lectures for a course student and teacher dono ke liya.
lectureRouter.get('/upcoming/:courseId', authMiddleware, getUpcomingLiveLectures);
lectureRouter.get('/:lectureId/join', authMiddleware, getLectureById);
lectureRouter.post('/:lectureId/summary', authMiddleware, summarizeLecture);
module.exports=lectureRouter;