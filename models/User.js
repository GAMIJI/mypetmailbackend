import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "vendor", "doctor"],
      default: "user",
    },
    otp: {
      type: String,
    },
    isVerified: { type: Boolean, default: false },
    profilePicture: {
      type: String,
      default:
        "https://iconarchive.com/download/i107063/Flat-Design/User-Profile-2/user-profile-icon.ico",
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      
    },
    education: String,
    experience: String,
    college: String,
    specialization: String,
    licenseNumber: String,
    clinicAddress: String,
    availableDays: [String],
    timings: {
      start: String,
      end: String,
    },
    consultationFee: Number,
    documents: [String],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
