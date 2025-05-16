import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // Ensure `.js` if using ES Modules
import { addProduct, addStore, getVendorProducts } from "../controllers/vendorController.js"; // Same here
import { uploadFields } from "../middleware/uploadMiddleware.js";
 
const router = express.Router();

// Route: POST /api/vendor/addstore
// Description: Add a store (requires authentication)
router.post("/addStore",authMiddleware, uploadFields, addStore);

router.post("/addProduct",authMiddleware,uploadFields,addProduct)

router.get("/getVendorProducts", authMiddleware, getVendorProducts);

export default router;
