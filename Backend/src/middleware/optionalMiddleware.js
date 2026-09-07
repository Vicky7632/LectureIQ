const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const redisClient = require("../config/redis");

const optionalStudent = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_KEY);
    if (!payload?._id) return next();

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) return next();

    const student = await Student.findById(payload._id);
    if (!student) return next();

    req.student = student; // silently attach
    next();
  } catch (err) {
    next(); // ignore errors
  }
};

module.exports = optionalStudent;
