const jwt = require("jsonwebtoken");
const Student = require('../models/student');
const redisClient = require("../config/redis");
const studentMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = jwt.verify(token, process.env.JWT_KEY);
        const { _id } = payload;
        if (!_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
         //abb block list me present to nahi hai na
        const IsBlocked = await redisClient.exists(`token:${token}`);
        if (IsBlocked) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const student = await Student.findById(_id).select("+password");
        if (!student) {
           return res.status(401).json({ message: "Unauthorized" });
        }
        req.student = student;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
module.exports = studentMiddleware;