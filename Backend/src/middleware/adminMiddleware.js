const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_KEY);

    if (!payload?._id || payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    //  Redis: USER BLOCK CHECK (BEST PRACTICE)
    const isBlocked = await redisClient.get(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Account blocked" });
    }

    //  Fetch admin
    const admin = await Student.findById(payload._id).select(
      "_id firstName email role isEmailVerified isActive"
    );

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (!admin.isEmailVerified) {
      return res.status(403).json({ message: "Admin email not verified" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account inactive" });
    }

    // Attach admin to request
    req.user = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = adminMiddleware;
