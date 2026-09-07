const Student=require('../models/student');
const validate=require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient=require('../config/redis');
const validator=require('validator');
const nodemailer = require("nodemailer");
const  FRONTEND_URL  = process.env.FRONTEND_URL ||"http://localhost:3000";
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//register
const register =async (req,res)=>{
  try {
    validate(req.body);

    const { firstName, lastName, email, password } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "student",
      isVerified: false,
    });

    // email verify token
    const emailVerifyToken = jwt.sign(
      { _id: student._id, type: "EMAIL_VERIFY" },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );
    console.log("EMAIL VERIFY TOKEN:", emailVerifyToken);
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;

    // email sending should NOT break registration
    try {
      await sendEmail(
        student.email,
        "Verify your LectureIQ account",
        `
        <p>Hi ${student.firstName},</p>
        <p>Please verify your email to activate your account.</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>This link is valid for 24 hours.</p>
        `
      );
    } catch (emailError) {
      console.error("Email failed:", emailError.message);
      // ignore email failure
    }

    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });

  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}

//login
const login=async (req,res)=>{
    try{
      const {email,password}=req.body;
       if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
      //password sensitive hone ke badd bhi mujhe iss quarry me chaiya islie select("+password") use kiya gya hai
      const student= await Student.findOne({email}) .select("+password +isEmailVerified");
     // console.log(student);
      if (!student) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
      const match= await bcrypt.compare(password,student.password);
        if (!match) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
     if (!student.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before login",
      });
    }
        
       // console.log(reply);
    const token =  jwt.sign({_id:student._id , email:email, role:student.role},process.env.JWT_KEY,{expiresIn: 60*60});
    await student.save();
    //cookie
     res.cookie('token',token,{
         httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60*60*1000});

        const reply={
            firstName:student.firstName,
            email:student.email,
            _id:student._id,
            role:student.role
        }
    res.status(200).json({
         student:reply,
         message:"Login Successfully"
    })
    }
    catch(err){
        // Known client errors
    if (err.message === "Invalid Credentials") {
      return res.status(401).json({ message: err.message });
    }

    // Server / unexpected errors
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
    }
}

//logout
const logout=async (req,res)=>{
  try{
    const {token}=req.cookies;
    const payload=jwt.decode(token);
      if (!payload || !payload.exp)
            throw new Error("Invalid Token");
    await redisClient.set(`token:${token}`,'Blocked');  
    await redisClient.expireAt(`token:${token}`,payload.exp);
     res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({ message: "Logged out successfully" });
  }
  catch(err){
       res.status(500).json({ message: "Logout failed", error: err.message });
  }
}

//change-password
const changePassword=async (req,res)=>{
  try{
       const {oldPassword,newPassword}=req.body;
       if(!oldPassword || !newPassword){
        return res.status(400).json({ message: "Old & new password required" });
       }
       const isMatch=await bcrypt.compare(oldPassword,req.student.password);
       if(!isMatch){
         return res.status(400).json({ message: "Old password incorrect" });
       }
       const isSame=await bcrypt.compare(newPassword,req.student.password);
       if(isSame){
         return res.status(400).json({ message: "New password must be different" });
       }
       //valiadtion for strong new password
        if (!validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      });
    }
       //hashed password ko save in db
       const hashedPassword=await bcrypt.hash(newPassword,10);
       req.student.password=hashedPassword;
       await req.student.save();
       //logout from current session
       res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
         return res.status(200).json({
      message: "Password changed successfully. Please login again.",
    });
  }
  catch(err){
     return res.status(500).json({ message: err.message });
  }
}
//reset-password
const resetPassword=async (req,res)=>{
  try{
      const { token, newPassword, confirmPassword }=req.body;
      //field checking
       if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Token, new password and confirm password are required",
      });
    }
    //check newPassword is equal to confirmPassword or not.
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }
    //check password is strong or not
     const isStrong = validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

    if (!isStrong) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number and special character",
      });
    }
    //verify reset token
     let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } 
    catch (err) {
      return res.status(401).json({
        message: "Invalid or expired reset token",
      });
    }
     if (payload.type !== "RESET_PASSWORD") {
      return res.status(401).json({
        message: "Invalid reset token",
      });
    }
    const { _id } = payload;
     const student = await Student.findById(_id).select("+password");
    if (!student) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // prevent same password
    const isSame = await bcrypt.compare(newPassword, student.password);
    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from old password",
      });
    }
    //hashed the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    await student.save();
    
      //  success response
    return res.status(200).json({
      message: "Password reset successful. Please login again.",
    });
  }
  catch(err){
   return res.status(500).json({
      message: "Internal server error",
    });
  }
}
//forgot-password
const forgotPassword=async (req,res)=>{
try{
     const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // check if student exists
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }
     // create reset token
    const token = jwt.sign(
      { _id: student._id, type: "RESET_PASSWORD" },
      process.env.JWT_KEY,
      { expiresIn: "10m" }
    );
    console.log("RESET PASSWORD TOKEN:", token)
    //email preparation
    const transporter = nodemailer.createTransport({
       service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"LectureIQ" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: "Reset your password",
      html: `
        <p>Hi ${student.firstName},</p>
        <p>You requested to reset your password.</p>
        <p>Click this link to reset your password (valid for 10 minutes):</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Password reset email sent successfully",
    });
}
catch(err){
    console.error("ForgotPasswordError:", err);
    return res.status(500).json({ message: "Internal server error" });
}
}
//verify email.
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    // JWT verify
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.type !== "EMAIL_VERIFY") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    //  Redis check (token exist?)
    const redisUserId = await redisClient.get(`email_verify:${token}`);
    if (!redisUserId) {
      return res.status(400).json({
        message: "Verification link expired or already used",
      });
    }

    //  Find user
    const student = await Student.findById(payload._id);
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    //  Mark verified
    student.isEmailVerified = true;
    student.emailVerifiedAt = new Date();
    await student.save();

    //  Delete token from Redis (ONE TIME USE)
    await redisClient.del(`email_verify:${token}`);

    //  Auto login token
    const loginToken = jwt.sign(
      {
        _id: student._id,
        email: student.email,
        role: student.role,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", loginToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Email verified & logged in successfully",
      student: {
        _id: student._id,
        firstName: student.firstName,
        email: student.email,
        role: student.role,
      },
    });
  } catch (err) {
    console.error("VerifyEmailError:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//reverify
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const emailVerifyToken = jwt.sign(
      {
        _id: student._id,
        type: "EMAIL_VERIFY",
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    // 🔥 THIS WAS MISSING
    await redisClient.set(
      `email_verify:${emailVerifyToken}`,
      student._id.toString(),
      { EX: 60 * 60 * 24 }
    );

    const verifyLink = `${process.env.BACKEND_URL}/auth/verify-email?token=${emailVerifyToken}`;

    await sendEmail(
      student.email,
      "Verify your LectureIQ account",
      `
        <p>Hi ${student.firstName},</p>
        <p>Please verify your email.</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>Valid for 24 hours.</p>
      `
    );

    return res.status(200).json({
      message: "Verification email resent successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//google auth

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential required" });
    }

    //verify google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      email,
      given_name,
      family_name,
      email_verified,
      picture,
    } = payload;

    if (!email_verified) {
      return res.status(401).json({
        message: "Google email not verified",
      });
    }

    // find user
    let student = await Student.findOne({ email });

    //  SIGNUP
    if (!student) {
      student = await Student.create({
        firstName: given_name || "Google",
        lastName: family_name || "User",
        email,
        password: "GOOGLE_AUTH", // dummy
        isVerified: true,
        emailVerifiedAt: new Date(),
        profileImage: picture,
        role: "student",
      });
    }

    // JWT
    const token = jwt.sign(
      {
        _id: student._id,
        email: student.email,
        role: student.role,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    //  COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    //  response
    return res.status(200).json({
      message: "Google login successful",
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
      },
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    return res.status(500).json({
      message: "Google authentication failed",
    });
  }
};

//admin register
const adminRegister = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, lastName, email, password } = req.body;

    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Student.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: false,
    });

    const emailVerifyToken = jwt.sign(
      { _id: admin._id, type: "EMAIL_VERIFY" },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

   const verifyLink =
  `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;


    try {
      await sendEmail(
        admin.email,
        "Verify your LectureIQ admin account",
        `
        <p>Hi ${admin.firstName},</p>
        <p>You have been invited as an admin.</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>This link is valid for 24 hours.</p>
        `
      );
    } catch (e) {
      console.error("Email failed:", e.message);
    }

    return res.status(201).json({
      message: "Admin created. Verification email sent.",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//teacher register by admin
const teacherRegister=async (req,res)=>{
  try{
     //data ko validate
     validate(req.body);
     //data nikalenge abb
     const {firstName,lastName,email,password}=req.body;
     //check if email already exist
     const existing=await Student.findOne({email});
     if(existing){
      return res.status(409).json({message: "Email already registered"});
     }
     //ab password ko hash formed me
     const hashedPassword=await bcrypt.hash(password,10);
     const teacher=await Student.create({
      firstName,
      lastName,
      email,
      password:hashedPassword,
      role:"teacher",
        isVerified: false,
      isActive: true,
     })
      return res.status(201).json({
      message: "Teacher registered successfully. Awaiting admin approval.",
      teacher: {
        _id: teacher._id,
        firstName: teacher.firstName,
        email: teacher.email,
        role: teacher.role,
        isVerified: teacher.isVerified,
      },
    });
  }
  catch(err){
       console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// admin verify teacher
const adminVerifyTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // find teacher
    const teacher = await Student.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // role check
    if (teacher.role !== "teacher") {
      return res.status(400).json({ message: "User is not a teacher" });
    }

    // already verified?
    if (teacher.isEmailVerified) {
      return res.status(400).json({ message: "Teacher already verified" });
    }

    // approve
    teacher.isEmailVerified = true;
    teacher.emailVerifiedAt = new Date();
    await teacher.save();

    return res.status(200).json({
      message: "Teacher verified successfully",
      teacher: {
        _id: teacher._id,
        firstName: teacher.firstName,
        email: teacher.email,
        role: teacher.role,
        isEmailVerified: teacher.isEmailVerified,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports={register,login,logout,changePassword, resetPassword,forgotPassword,verifyEmail,resendVerification,googleAuth,adminRegister,teacherRegister,adminVerifyTeacher};