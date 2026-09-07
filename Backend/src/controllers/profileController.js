const Student = require("../models/student");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");

const getMyProfile = async (req, res) => {
  try {
    const user = req.student;
    const role = user.role;

    if (role === "student") {
      const enrolledCount = await Enrollment.countDocuments({ student: user._id, status: "active" });
      return res.status(200).json({
        role: "student",
        profile: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          bio: user.bio || "",
          isEmailVerified: user.isEmailVerified || false,
          profilePicture: user.profilePicture || null,
          enrolledCourses: enrolledCount,
          createdAt: user.createdAt,
        },
      });
    }

    if (role === "teacher") {
      const totalCourses = await Course.countDocuments({ teacher: user._id });
      const publishedCourses = await Course.countDocuments({ teacher: user._id, status: "published" });
      return res.status(200).json({
        role: "teacher",
        profile: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          bio: user.bio || "",
          isEmailVerified: user.isEmailVerified || false,
          profilePicture: user.profilePicture || null,
          totalCourses,
          publishedCourses,
          createdAt: user.createdAt,
        },
      });
    }

    if (role === "admin") {
      const totalUsers = await Student.countDocuments();
      const totalCourses = await Course.countDocuments();
      return res.status(200).json({
        role: "admin",
        profile: {
          _id: user._id,
          firstName: user.firstName,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          bio: user.bio || "",
          isEmailVerified: user.isEmailVerified || false,
          profilePicture: user.profilePicture || null,
          totalUsers,
          totalCourses,
          createdAt: user.createdAt,
        },
      });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("GetProfileError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const updateMyProfile = async (req, res) => {
  try {
    const user = req.student; // authMiddleware se aaya
    const { firstName, lastName, phoneNumber, bio } = req.body;
    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await Student.findOne({ 
        phoneNumber, 
        _id: { $ne: user._id } // exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Phone number already in use by another account" 
        });
      }
    }
    // Update allowed fields only
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    // Return updated profile (same structure as GET)
    const updatedProfile = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      bio: user.bio || "",
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture || null,
      createdAt: user.createdAt,
    };

    // Add role-specific fields if needed
    if (user.role === 'teacher') {
      const Course = require('../models/course');
      updatedProfile.totalCourses = await Course.countDocuments({ teacher: user._id });
      updatedProfile.publishedCourses = await Course.countDocuments({ teacher: user._id, status: 'published' });
    } else if (user.role === 'student') {
      const Enrollment = require('../models/enrollment');
      updatedProfile.enrolledCourses = await Enrollment.countDocuments({ student: user._id, status: 'active' });
    }
    else if (user.role === 'admin') {
      // Admin ke liye kuch extra fields nahi, ya kuch specific ho to daalo
      const Student = require('../models/student');
      const Course = require('../models/course');
      updatedProfile.totalUsers = await Student.countDocuments();
      updatedProfile.totalCourses = await Course.countDocuments();
    }


    res.status(200).json({
      role: user.role,
      profile: updatedProfile,
    });

  } catch (err) {
    console.error('UpdateProfileError:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports = { getMyProfile,updateMyProfile };
