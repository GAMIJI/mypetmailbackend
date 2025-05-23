import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // Ensure `.js` if using ES Modules
import { addProduct, addStore, deleteProductById, dispatchOrder, getCategories, getProductById, getVendorOrders, getVendorProducts, getVendorStore, loginVendor, registerVendor, updateProduct } from "../controllers/vendorController.js"; // Same here
import { uploadFields } from "../middleware/uploadMiddleware.js";
 
const router = express.Router();

// Route: POST /api/vendor/addstore
// Description: Add a store (requires authentication)


router.post("/vendorRegister",registerVendor)

router.post("/vendorLogin",loginVendor)

router.post("/addStore",authMiddleware, uploadFields, addStore);

router.get("/getVendorStore",authMiddleware, getVendorStore);

router.get("/getCategories",authMiddleware, getCategories);

router.post("/addProduct",authMiddleware,uploadFields,addProduct)

router.post("/updateProduct/:id",authMiddleware,uploadFields,updateProduct)

router.get("/getVendorProducts", authMiddleware, getVendorProducts);

router.get("/getProductById/:id",uploadFields,getProductById)

router.delete('/deleteProduct',authMiddleware,deleteProductById);

router.post("/dispatchOrder",authMiddleware,dispatchOrder)

router.get("/getVendorOrders",authMiddleware,getVendorOrders)

export default router;
