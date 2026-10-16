const jwt = require("jsonwebtoken");
const Student = require('../models/student');
const redisClient = require("../config/redis");
const createStudentMiddleware = ({
    requireAccountState = true,
    includePassword = false,
} = {}) => async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = jwt.verify(token, process.env.JWT_KEY);
        if (!payload?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const query = Student.findById(payload._id);
        const student = await (includePassword ? query.select("+password") : query);
        if (!student) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (requireAccountState && !student.isEmailVerified) {
            return res.status(403).json({ message: "Email not verified" });
        }
        if (requireAccountState && !student.isActive) {
            return res.status(403).json({ message: "Account inactive" });
        }
        req.student = student;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

const studentMiddleware = createStudentMiddleware();
studentMiddleware.forLogout = createStudentMiddleware({
    requireAccountState: false,
});
studentMiddleware.withPassword = createStudentMiddleware({
    includePassword: true,
});

module.exports = studentMiddleware;