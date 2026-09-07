const express = require("express");
const studentMiddleware = require("../middleware/studentMiddleware");
const { getMyProfile,updateMyProfile } = require("../controllers/profileController");

const profileRouter = express.Router();

profileRouter.get("/me", studentMiddleware, getMyProfile);
profileRouter.put("/me", studentMiddleware, updateMyProfile);
module.exports = profileRouter;
