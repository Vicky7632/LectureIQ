const jwt = require("jsonwebtoken");
const Student = require('../models/student');
const redisClient = require("../config/redis");

const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_KEY);
    if (!payload?._id) return res.status(401).json({ message: "Invalid token" });

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) return res.status(401).json({ message: "Token invalidated" });

    const user = await Student.findById(payload._id).select("_id firstName lastName email role isEmailVerified isActive");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user; // ab har jagah req.user use karo
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;