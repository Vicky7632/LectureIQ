const Student = require("../models/student");
const Course = require("../models/course");
const Payment = require("../models/payment");
const Enrollment = require("../models/enrollment");
const stripPaymentInternals = (payment) => {
  const data = payment.toObject ? payment.toObject() : { ...payment };
  delete data.providerSignature;
  delete data.meta;
  return data;
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Student.find({ role: "teacher" }).select(
      "_id firstName lastName email isVerified isActive createdAt isEmailVerified phoneNumber bio profileImage"
    );
    return res.status(200).json({ teachers });
  } catch (err) {
    console.error("GetAllTeachersError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "firstName lastName")
      .select("title status approvedBy approvedAt teacher price isPaid lecturesCount");
    return res.status(200).json({ courses });
  } catch (err) {
    console.error("GetAllCoursesError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ role: "student" }).select(
      "_id firstName lastName email isVerified isActive profileImage"
    );
    return res.status(200).json({ students });
  } catch (err) {
    console.error("GetAllStudentsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .select(
        "_id student course enrollment amount currency status paymentProvider providerOrderId providerPaymentId createdAt updatedAt"
      )
      .populate("student", "firstName lastName email")
      .populate("course", "title price")
      .populate(
        "enrollment",
        "_id student course status paymentStatus enrolledAt expiresAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      payments: payments.map(stripPaymentInternals),
    });
  } catch (err) {
    console.error("GetAllPaymentsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ course: courseId })
      .populate("student", "firstName lastName email")
      .sort({ enrolledAt: -1 });

    return res.status(200).json({ enrollments });
  } catch (err) {
    console.error("GetCourseEnrollmentsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getCoursePayments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const payments = await Payment.find({ course: courseId })
      .select(
        "_id student course enrollment amount currency status paymentProvider providerOrderId providerPaymentId createdAt updatedAt"
      )
      .populate("student", "firstName lastName email");

    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p.status === "success" ? p.amount : 0),
      0
    );

    return res.status(200).json({
      totalRevenue,
      totalPayments: payments.length,
      payments: payments.map(stripPaymentInternals),
    });
  } catch (err) {
    console.error("GetCoursePaymentsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//revenue status
const getRevenueStats = async (req, res) => {
  try {
    const payments = await Payment.find({ status: "success" });

    const totalRevenue = payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return res.status(200).json({
      totalRevenue,
      totalTransactions: payments.length,
    });
  } catch (err) {
    console.error("RevenueStatsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAdminDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses, pendingApprovals, revenueResults] =
      await Promise.all([
        Student.countDocuments({ role: "student" }),
        Student.countDocuments({ role: "teacher" }),
        Course.countDocuments(),
        Course.countDocuments({ status: "pending" }),
        Payment.aggregate([
          { $match: { status: "success" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    return res.status(200).json({
      totalStudents,
      totalTeachers,
      totalCourses,
      pendingApprovals,
      totalRevenue: revenueResults[0]?.total || 0,
    });
  } catch (err) {
    console.error("AdminDashboardStatsError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllTeachers,
  getAllCourses,
  getAllStudents,
  getAllPayments,
  getCourseEnrollments,
  getCoursePayments,
  getRevenueStats,
  getAdminDashboardStats,
};