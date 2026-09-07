const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getAllTeachers, getAllCourses, getAllStudents,getAllPayments ,getCourseEnrollments ,getCoursePayments,getRevenueStats} = require("../controllers/adminDashboard");

const adminRouter = express.Router();

// GET all teachers
adminRouter.get("/teachers", adminMiddleware, getAllTeachers);

// GET all courses
adminRouter.get("/courses", adminMiddleware, getAllCourses);

// GET all students
adminRouter.get("/students", adminMiddleware, getAllStudents);
// for payment get
adminRouter.get("/payments", adminMiddleware, getAllPayments);
//enrollment
adminRouter.get( "/course/:courseId/enrollments",adminMiddleware,getCourseEnrollments);
//single course payment
adminRouter.get("/course/:courseId/payments",adminMiddleware,getCoursePayments);
//all revenue
adminRouter.get("/revenue", adminMiddleware, getRevenueStats);

module.exports = adminRouter;