const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");
const Lecture = require("../models/lecture");

const getTeacherCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const courses = await Course.find({ instructor: teacherId })
            .select("title price isPublished createdAt");

        return res.status(200).json({ courses });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getCourseStudents = async (req, res) => {
    try {
        const { courseId } = req.params;

        const students = await Enrollment.find({ course: courseId })
            .populate("student", "firstName lastName email")
            .sort({ enrolledAt: -1 });

        return res.status(200).json({ students });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
const getTeacherDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const courses = await Course.find({ instructor: teacherId });
        const courseIds = courses.map(c => c._id);

        const totalStudents = await Enrollment.countDocuments({
            course: { $in: courseIds }
        });

        const payments = await Payment.find({
            course: { $in: courseIds },
            status: "success"
        });

        const totalRevenue = payments.reduce(
            (sum, p) => sum + p.amount,
            0
        );

        return res.status(200).json({
            totalCourses: courses.length,
            totalStudents,
            totalRevenue
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
const getTeacherCourseLectures = async (req, res) => {
    try {
        const { courseId } = req.params;
        const teacherId = req.teacher._id;

        // Check course ownership
        const course = await Course.findOne({
            _id: courseId,
            teacher: teacherId
        });

        if (!course) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Not your course"
            });
        }

        //  Fetch lectures
        const lectures = await Lecture.find({ course: courseId })
            .select("title duration order isPublished createdAt")
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            courseTitle: course.title,
            totalLectures: lectures.length,
            lectures
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch lectures",
            error: err.message
        });
    }
};
module.exports = { getTeacherCourses, getCourseStudents, getTeacherDashboardStats, getTeacherCourseLectures };
