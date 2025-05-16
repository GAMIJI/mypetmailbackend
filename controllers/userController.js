import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import generateOtp from "../utils/generateOtp.js";
import fs from "fs";
import path from "path";
import Appointment from "../models/Appointment.js";
import DocReview from "../models/DocReview.js";

export const registerUser = async (req, res) => {
  const {
    name,
    userEmail,
    password,
    phone,
    role,
    education,
    experience,
    college,
    specialization,
    licenseNumber,
    clinicAddress,
    availableDays,
    timings,
    consultationFee,
  } = req.body;

  try {
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.isVerified) {
      res.status(400);
      return res.status(400).json({
        success: false,
        message: "User already exists and is verified.",
      });
    }

    const profilePicture = req.files?.profilePicture
      ? req.files.profilePicture[0].path.replace(/\\/g, "/")
      : "";

    const documents =
      req.files?.documents?.map((file) => file.path.replace(/\\/g, "/")) || [];

    const otp = await generateOtp(4);

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    const doctorFields =
      role === "doctor"
        ? {
            education,
            experience,
            college,
            specialization,
            licenseNumber,
            clinicAddress,
            availableDays,
            timings,
            consultationFee,
            documents,
            gender,
          }
        : {};

    if (existingUser) {
      existingUser.name = name;
      existingUser.userEmail = userEmail;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.isVerified = false;
      existingUser.role = role || "user";
      existingUser.profilePicture = profilePicture;

      Object.assign(existingUser, doctorFields);

      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        profilePicture,
        userEmail,
        phone,
        password: hashedPassword,

        otp,
        isVerified: false,
        role: role || "user",
        ...doctorFields,
      });
    }

    res.status(200).json({ message: "OTP sent successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      message: "OTP verified successfully",
      token: generateToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

export const resendOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is already verified" });
    }

    const newOtp = await generateOtp(4);
    user.otp = newOtp;
    await user.save();

    res.status(200).json({ message: "OTP resent successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loginUser = async (req, res, next) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ phone: identifier }, { userEmail: identifier }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is not verified. Please complete OTP verification.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user),
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res) => {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing in the request" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, userEmail, phone } = req.body;
    const profilePicture = req.files?.profilePicture
      ? req.files.profilePicture[0].path.replace(/\\/g, "/")
      : "";
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.userEmail = userEmail || user.userEmail;
    user.phone = phone || user.phone;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDoc = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      userEmail,
      phone,
      role,
      education,
      experience,
      college,
      specialization,
      licenseNumber,
      clinicAddress,
      availableDays,
      timings,
      consultationFee,
      gender,
    } = req.body;

    const profilePicture = req.files?.profilePicture
      ? req.files.profilePicture[0].path.replace(/\\/g, "/")
      : "";

    const documents =
      req.files?.documents?.map((file) => file.path.replace(/\\/g, "/")) || [];

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Basic fields
    user.name = name || user.name;
    user.userEmail = userEmail || user.userEmail;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.profilePicture = profilePicture || user.profilePicture;

    // Doctor-specific fields (if role is doctor)
    if (user.role === "doctor") {
      user.education = education || user.education;
      user.experience = experience || user.experience;
      user.college = college || user.college;
      user.specialization = specialization || user.specialization;
      user.licenseNumber = licenseNumber || user.licenseNumber;
      user.clinicAddress = clinicAddress || user.clinicAddress;
      user.availableDays = availableDays || user.availableDays;
      user.gender = gender || user.gender;
      if (timings) {
        user.timings =
          typeof timings === "string" ? JSON.parse(timings) : timings;
      }

      user.consultationFee = consultationFee || user.consultationFee;

      if (documents.length > 0) {
        user.documents = Array.from(new Set([...user.documents, ...documents]));
      }
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedDocs = user.documents.filter((doc) => doc !== filePath);

    if (updatedDocs.length === user.documents.length) {
      return res
        .status(404)
        .json({ message: "Document not found in user's profile" });
    }

    user.documents = updatedDocs;
    await user.save();

    // Delete file from uploads folder
    const fullPath = path.join(process.cwd(), filePath);
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        // Still return success, as file might already be deleted
      }
    });

    res.status(200).json({
      message: "Document deleted successfully",
      documents: user.documents,
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const userId = req?.user?.id;
    let wishlist = [];

    // If user is logged in, try to get their wishlist
    if (userId) {
      const user = await User.findById(userId).select("wishlist");
      if (user) {
        wishlist = user.wishlist.map((id) => id.toString());
      }
    }

    const doctors = await User.find({ role: "doctor" }).lean();

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found",
      });
    }

    const doctorsWithWishlistStatus = doctors.map((doctor) => ({
      ...doctor,
      isWishlisted: wishlist.includes(doctor._id.toString()),
    }));

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      doctors: doctorsWithWishlistStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFilteredDoctors = async (req, res) => {
  try {
    const {
      gender,
      specialization,
      minExperience,
      maxFee,
      day,
      location,
      minRating,
    } = req.query;

    
    const userId = req?.user?.id;
    let wishlist = [];

    if (userId) {
      const user = await User.findById(userId).select("wishlist");
      if (user) {
        wishlist = user.wishlist.map((id) => id.toString());
      }
    }

    let query = { role: "doctor" };

    if (gender) query.gender = gender;
    if (specialization) query.specialization = specialization;
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (maxFee) query.consultationFee = { $lte: parseInt(maxFee) };
    if (day) query.availableDays = day;
    if (location)
      query.clinicAddress = { $regex: location, $options: "i" };

    // Fetch doctors
    const doctors = await User.find(query).lean();

    // Optionally filter by minRating
    const doctorIds = doctors.map((d) => d._id);
    const reviews = await DocReview.aggregate([
      { $match: { doctor: { $in: doctorIds } } },
      {
        $group: {
          _id: "$doctor",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = {};
    reviews.forEach((r) => {
      ratingMap[r._id.toString()] = {
        averageRating: parseFloat(r.avgRating.toFixed(1)),
        totalReviews: r.totalReviews,
      };
    });

    const filteredDoctors = doctors
      .filter((doc) => {
        const stats = ratingMap[doc._id.toString()] || { averageRating: 0 };
        return !minRating || stats.averageRating >= parseFloat(minRating);
      })
      .map((doc) => {
        const stats = ratingMap[doc._id.toString()] || {};
        return {
          ...doc,
          ...stats,
          isWishlisted: wishlist.includes(doc._id.toString()),
        };
      });

    res.status(200).json({
      success: true,
      message: "Filtered doctors fetched successfully",
      doctors: filteredDoctors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDoctorDetails = async (req, res) => {
  const { doctorId } = req.query;

  try {
    // Find the doctor by ID in the database
    const doctor = await User.findById(doctorId).lean();

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // 2. Get reviews for the doctor
    const reviews = await DocReview.find({ doctor: doctorId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          ).toFixed(1)
        : 0;

    // Return the doctor's details
    res.status(200).json({
      success: true,
      message: "Doctor details fetched successfully",
      doctor,
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      doctorId,
      patientName,
      patientPhone,
      appointmentDate,
      appointmentTime,
    } = req.body;

    if (
      !doctorId ||
      !patientName ||
      !patientPhone ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const user = await User.findById(userId);

    if (user.role !== "user") {
      return res
        .status(403)
        .json({ message: "Only users can book appointments." });
    }
    if (userId === doctorId) {
      return res
        .status(403)
        .json({ message: "Doctors cannot book appointments with themselves." });
    }

    const appointment = new Appointment({
      userId,
      doctorId,
      patientName,
      patientPhone,
      appointmentDate,
      appointmentTime,
    });

    await appointment.save();
    res
      .status(201)
      .json({ message: "Appointment created successfully.", appointment });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAppointmentsByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const appointments = await Appointment.find({ userId });

    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAppointmentsByDoctorId = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (doctor.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Access denied. Only doctors can view this." });
    }

    const appointments = await Appointment.find({ doctorId }).populate(
      "userId",
      "name email"
    );

    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching doctor's appointments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required." });
    }

    if (userId === doctorId) {
      return res
        .status(400)
        .json({ message: "You cannot add yourself to wishlist." });
    }

    const user = await User.findById(userId);
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (user.wishlist.includes(doctorId)) {
      return res
        .status(400)
        .json({ message: "Doctor is already in wishlist." });
    }

    user.wishlist.push(doctorId);
    await user.save();

    res
      .status(200)
      .json({ message: "Doctor added to wishlist.", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required." });
    }

    const user = await User.findById(userId);

    if (!user.wishlist.includes(doctorId)) {
      return res.status(404).json({ message: "Doctor not found in wishlist." });
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== doctorId.toString()
    );

    await user.save();

    res.status(200).json({
      message: "Doctor removed from wishlist.",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addDoctorReview = async (req, res) => {
  console.log(req.body);
  
  const { rating, review, doctorId } = req.body;
  const userId = req.user?.id;

  try {
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const alreadyReviewed = await DocReview.findOne({
      doctor: doctorId,
      user: userId,
    });
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ success: false, message: "Already reviewed this doctor" });
    }

    const newReview = await DocReview.create({
      doctor: doctorId,
      user: userId,
      rating,
      review,
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDoctorReviews = async (req, res) => {
  const { doctorId } = req.query;

  try {
    const reviews = await DocReview.find({ doctor: doctorId }).populate(
      "user",
      "name profilePicture"
    );

    res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
