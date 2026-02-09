const mongoose=require('mongoose');
const {Schema}=mongoose;
const studentSchema=new Schema({
 firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true, //  email cannot be changed
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // optional but unique
    },

    password: {
      type: String,
      required: true,
      select: false, // password kabhi by default fetch na ho
    },

    role: {
      type: String,
      enum: ["student","teacher", "admin"],
      default: "student",
    },

    //  Account status
    isActive: {
      type: Boolean,
      default: true,
    },

  isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
    },

    phoneVerifiedAt: {
      type: Date,
    },

    //  Security & Auth
    passwordChangedAt: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },

    //  Forgot / Reset password (OTP based)

    // 🎓 Learning related
    joinedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    completedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    //  Subscription / Payment
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    subscriptionExpiry: {
      type: Date,
    },

    //  Profile
    profileImage: {
      type: String,
    },

    bio: {
      type: String,
      maxlength: 300,
    },

    //  Soft delete (future safety)
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);


const Student=mongoose.model("Student",studentSchema);
module.exports=Student;



   

