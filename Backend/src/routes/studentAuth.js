const express=require('express');
const authRouter=express.Router();
const {register,login,logout,changePassword, resetPassword,forgotPassword,verifyEmail,resendVerification,googleAuth,adminRegister,teacherRegister,adminVerifyTeacher}=require('../controllers/studentAuthent');
const studentMiddleware=require('../middleware/studentMiddleware');
const adminMiddleware=require("../middleware/adminMiddleware");
const teacherMiddleware=require("../middleware/teacherMiddleware");
//register
authRouter.post('/register',register);
//login
authRouter.post('/login',login);
//logout
authRouter.post('/logout',studentMiddleware,logout);
// //verification and recovery
//email-verify
authRouter.get('/verify-email',verifyEmail);
//resend verification email
authRouter.post('/resend-verification', resendVerification);
 //forgot-passord
authRouter.post('/forgot-password',forgotPassword);
//reset-password
authRouter.post('/reset-password',resetPassword);
 //change-password
authRouter.post('/change-password',studentMiddleware,changePassword);
// //social auth
 //google-signup and login
authRouter.post('/google-auth',googleAuth);
//admin registration.
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
//teacher register
authRouter.post('/teacher/register',adminMiddleware,teacherRegister);
//verify by admin
authRouter.patch("/admin/teacher/verify/:teacherId",adminMiddleware,adminVerifyTeacher);

module.exports=authRouter;