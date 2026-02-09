const jwt = require("jsonwebtoken");
const Student = require('../models/student');
const redisClient = require("../config/redis");
const teacherMiddleware= async (req,res,next)=>{
    try{
     //pahle token check karngee
     const token=req.cookies?.token;
     if(!token){
        return res.status(401).json({message:"Authentication required"});
     }
     //verwify token
     const payload=jwt.verify(token,process.env.JWT_KEY);
    // id and role ,exist and role match or not
    if (!payload?._id || payload.role !== "teacher") {
      return res.status(403).json({ message: "Teacher access only" });
    }
    //check kar lenge ki redis me block to nahi hai naa
    const isBlocked = await redisClient.get(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Token invalidated"});
    }
    // teacher ko fetch karenge
     const teacher = await Student.findById(payload._id).select(
      "_id firstName lastName email role isEmailVerified isActive"
    );
    if (!teacher) {
      return res.status(401).json({ message: "Teacher not found" });
    }
    if (!teacher.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    if (!teacher.isActive) {
      return res.status(403).json({ message: "Account inactive" });
    }

    // Attach teacher to request
    req.user = teacher;
    next();
    }
    catch(err){
      return res.status(401).json({ message: "Invalid or expired token" });
    }
}
module.exports=teacherMiddleware;