import express from "express";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getUserById,
  updateUser,
  updateDoc,
  deleteDocument,
  getAllDoctors,
  getDoctorDetails,
  createAppointment,
  getAppointmentsByUserId,
  getAppointmentsByDoctorId,
  addToWishlist,
  removeFromWishlist,
  addDoctorReview,
  getDoctorReviews,
  getFilteredDoctors,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalMiddleware from "../middleware/optionalMiddleware.js";
import { uploadFields } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/registerUser", uploadFields, registerUser);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.post("/loginUser", loginUser);
router.get("/getUserById", authMiddleware, getUserById);
router.post("/updateUser", uploadFields, authMiddleware, updateUser);
router.post("/updateDoc", uploadFields, authMiddleware, updateDoc);
router.delete("/deleteDocument", uploadFields, authMiddleware, deleteDocument);



router.get("/getAllDoctors", optionalMiddleware, getAllDoctors);
router.get("/getDoctorDetails", getDoctorDetails);
router.post("/createAppointment", authMiddleware, createAppointment);
router.get("/getAppointmentsByUserId", authMiddleware, getAppointmentsByUserId);
router.get(
  "/getAppointmentsByDoctorId",
  authMiddleware,
  getAppointmentsByDoctorId
);

router.post("/addToWishlist", authMiddleware, addToWishlist);

router.post("/removeFromWishlist", authMiddleware, removeFromWishlist);

router.post("/addDoctorReview", authMiddleware, addDoctorReview);

router.get("/getDoctorReviews", authMiddleware, getDoctorReviews);

router.get("/getFilteredDoctors", optionalMiddleware, getFilteredDoctors);


export default router;
