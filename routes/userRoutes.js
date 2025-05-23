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
  getAllProducts,
  getProductById,
  addToCart,
  getUserCart,
  removeFromCart,
  getCategories,
  placeOrder,
  updateOrderStatus,
  getUserOrdersByStatus,
  getAllStores,
  getProductsByStoreId,
  getUserOrderDetails,
  getOrderDetailsById,
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

router.get("/getAllProducts", getAllProducts);

router.get("/getCategories", getCategories);

router.get("/getProductById", getProductById);

router.post("/addToCart",authMiddleware, addToCart ) ;

router.get("/getUserCart",authMiddleware, getUserCart)

router.post("/removeFromCart",authMiddleware, removeFromCart)

router.post("/placeOrder",authMiddleware, placeOrder)

router.post("/updateOrderStatus",authMiddleware, updateOrderStatus)

router.get("/getUserOrdersByStatus",authMiddleware, getUserOrdersByStatus)

router.get('/getUserOrderDetails/:id',authMiddleware,getUserOrderDetails)

router.get("/getAllStores", getAllStores )

router.get("/getProductsByStoreId/:storeId", getProductsByStoreId )

router.get("/getOrderDetailsById/:orderId", getOrderDetailsById )



  


export default router;
