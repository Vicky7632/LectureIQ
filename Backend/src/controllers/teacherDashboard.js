const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");
const Lecture = require("../models/lecture");

const getTeacherCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const courses = await Course.find({ teacher: teacherId });

        return res.status(200).json({ courses });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};


const getCourseStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findOne({
            _id: courseId,
            teacher: req.user._id,
        });

        if (!course) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Not your course",
            });
        }

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
        const teacherId = req.user._id;
        const courseIds = await Course.find({ teacher: teacherId }).distinct("_id");
        const [
            totalCourses,
            pendingCourses,
            activeEnrollments,
            revenueResults,
        ] = await Promise.all([
            Course.countDocuments({ teacher: teacherId }),
            Course.countDocuments({ teacher: teacherId, status: "pending" }),
            Enrollment.countDocuments({
                course: { $in: courseIds },
                status: "active",
            }),
            Payment.aggregate([
                {
                    $match: {
                        course: { $in: courseIds },
                        status: "success",
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

        return res.status(200).json({
            totalCourses,
            pendingCourses,
            activeEnrollments,
            totalRevenue: revenueResults[0]?.total || 0,
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
const getTeacherCourseLectures = async (req, res) => {
    try {
        const { courseId } = req.params;
        const teacherId = req.user._id;

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
            .select("title description videoUrl duration order isPreview lectureType isPublished createdAt")
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
