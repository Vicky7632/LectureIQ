const Course = require("../models/course");
const Lecture = require("../models/lecture");
const Student = require("../models/student");

const Enrollment = require("../models/enrollment");

const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            status: "published",
        })
            .select(
                "title description category level price isPaid thumbnail teacher lecturesCount totalDuration"
            )
            .populate("teacher", "firstName lastName");

        return res.status(200).json({
            courses,
        });
    } catch (err) {
        console.error("GetCoursesError:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//get course by id
const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.student?._id; // optional login

        const course = await Course.findOne({
            _id: courseId,
            status: "published",
        }).populate("teacher", "firstName lastName");

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        let enrolled = null;

        if (course.isPaid && studentId) {
            enrolled = await Enrollment.findOne({
                student: studentId,
                course: courseId,
                status: "active",
            });
        }

        // Paid + not enrolled
        if (course.isPaid && !enrolled) {
            return res.status(403).json({
                message: "Enrollment required",
                course: {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    isPaid: true,
                },
            });
        }
  return res.status(200).json({ course })

    } catch (err) {
        console.error("GetCourseByIdError:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

//get lecture
const getCourseLectures = async (req, res) => {
    try {
         const { courseId } = req.params;
    const studentId = req.student?._id;

    const course = await Course.findOne({
      _id: courseId,
      status: "published",
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let enrolled = null;

    if (course.isPaid && studentId) {
      enrolled = await Enrollment.findOne({
        student: studentId,
        course: courseId,
        status: "active",
      });
    }

    let lectures;

    if (course.isPaid && !enrolled) {
      // preview only
      lectures = await Lecture.find({
        course: courseId,
        isPreview: true,
      }).select("title description videoUrl duration order isPreview");
    } else {
      // full access
      lectures = await Lecture.find({ course: courseId }).select(
        "title description videoUrl duration order isPreview"
      );
    }

    return res.status(200).json({ lectures });
    } catch (err) {
        console.error("GetLecturesError:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//enroll course


const enrollInCourse = async (req, res) => {
    try {
        if (!req.student || req.student.role !== "student") {
            return res.status(403).json({ message: "Student access only" });
        }

        const studentId = req.student._id;
        const { courseId } = req.params;

        // course check
        const course = await Course.findOne({
            _id: courseId,
            status: "published",
        });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // already enrolled?
        const existing = await Enrollment.findOne({
            student: studentId,
            course: courseId,
        });

        if (existing) {
            return res.status(200).json({
                message: existing.status === "active"
                    ? "Already enrolled"
                    : "Enrollment already exists",
                alreadyEnrolled: existing.status === "active",
                enrollment: existing,
            });
        }

        if (course.isPaid) {
            return res.status(409).json({
                message: "Payment is required to enroll in this course",
            });
        }

        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
            status: "active",
            paymentStatus: "free",
        });

        return res.status(201).json({
            message: "Enrolled successfully (Free)",
            alreadyEnrolled: false,
            enrollment,
        });
    } catch (err) {
        if (err?.code === 11000) {
            try {
                const existing = await Enrollment.findOne({
                    student: req.student._id,
                    course: req.params.courseId,
                });
                if (existing) {
                    return res.status(200).json({
                        message: existing.status === "active"
                            ? "Already enrolled"
                            : "Enrollment already exists",
                        alreadyEnrolled: existing.status === "active",
                        enrollment: existing,
                    });
                }
            } catch (lookupError) {
                console.error("EnrollDuplicateLookupError:", lookupError);
                return res.status(500).json({ message: "Enrollment failed" });
            }
        }
        console.error("EnrollError:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getPublishedCourses,
    getCourseById,
    getCourseLectures,
    enrollInCourse,
};