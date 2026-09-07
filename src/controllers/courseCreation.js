// controllers/course.controller.js
const Course = require("../models/course");

const createCourse = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const {
      title,
      description,
      category,
      level,
      price
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const numericPrice = Number(price) || 0;
    const isPaid = numericPrice > 0;


    const course = await Course.create({
      title,
      description,
      category,
      level,
      price: isPaid ? numericPrice : 0,
      isPaid,
      teacher: teacherId,
      status: "draft"
    });

    return res.status(201).json({
      message: "Course created successfully (Draft)",
      course
    });

  } catch (err) {
    console.error("CreateCourseError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// course approved by admin

const adminApproveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const adminId = req.user._id;

    // find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // already published?
    if (course.status === "published") {
      return res.status(400).json({ message: "Course already approved" });
    }

    // approve course
    course.status = "published";
    course.approvedBy = adminId;
    course.approvedAt = new Date();

    await course.save();

    return res.status(200).json({
      message: "Course approved successfully",
      course,
    });

  } catch (err) {
    console.error("AdminApproveCourseError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//course rejected by admin
const adminRejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "pending") {
      return res.status(400).json({
        message: "Only pending courses can be rejected",
      });
    }

    course.status = "rejected";
    course.rejectionReason = reason;
    course.approvedBy = adminId;
    course.approvedAt = new Date();

    await course.save();

    return res.status(200).json({
      message: "Course rejected successfully",
      course,
    });

  } catch (err) {
    console.error("AdminRejectCourseError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// course submit by teacher for review
const submitCourseForReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // status checks
    if (course.status === "pending") {
      return res.status(400).json({
        message: "Course already submitted for review",
      });
    }

    if (course.status !== "draft") {
      return res.status(400).json({
        message: "Only draft courses can be submitted",
      });
    }

    // required validation
    if (
      !course.title ||
      !course.description ||
      !course.category ||
      !course.level
    ) {
      return res.status(400).json({
        message: "Course details incomplete",
      });
    }

    if (course.lecturesCount < 1) {
      return res.status(400).json({
        message: "Add at least one lecture before submitting",
      });
    }

    if (course.isPaid && course.price <= 0) {
      return res.status(400).json({
        message: "Paid course must have a valid price",
      });
    }

    // submit
    course.status = "pending";
    await course.save();

    return res.status(200).json({
      message: "Course submitted for admin review",
      course,
    });

  } catch (err) {
    console.error("SubmitCourseError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// course edit by teacher
const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;
    const { title, description, category, level, price, thumbnail } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    // ownership check
    if (course.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: "Not your course" });
    }
    // status check
    if (!["draft", "rejected"].includes(course.status)) {
      return res.status(400).json({
        message: "Course cannot be edited at this stage",
      });
    }
    // update only provided fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;

    if (price !== undefined) {
      course.price = price;
      course.isPaid = price > 0;
    }

    if (thumbnail !== undefined) {
      course.thumbnail = thumbnail;
    }
    // IF REJECTED → RESET REVIEW STATE
    if (course.status === "rejected") {
      course.status = "draft";
      course.rejectionReason = undefined;
      course.approvedBy = undefined;
      course.approvedAt = undefined;
    }
    await course.save();

    return res.status(200).json({
      message: "Course updated successfully",
      course,
    });

  }
  catch (err) {
    console.error("EditCourseError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { createCourse, adminApproveCourse, adminRejectCourse, submitCourseForReview, editCourse };
