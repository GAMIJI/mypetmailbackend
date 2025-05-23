// routes/categoryRoutes.js
import express from "express";
import { addCategory,  createFaq,  createTerms,  deleteCategory,  deleteFaq,  deleteTerms,  getAllFaqs,  getCategories, getProductsByStoreId, getTerms, getUsersByRole, getVendorStore, loginAdmin, privacyPolicy, privacyPolicyUpdate, registerAdmin } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/registerAdmin",registerAdmin)
router.post("/loginAdmin", loginAdmin)


router.post("/addCategory", addCategory);   // Public or protected (your choice)
router.get("/getCategories", getCategories);    // Fetch all

router.get("/getUsersByRole", getUsersByRole)

router.delete("/deleteCategories",deleteCategory)

router.get("/privacyPolicy",privacyPolicy)

router.post("/privacyPolicyUpdate",privacyPolicyUpdate)

router.get("/getVendorStore/:id",getVendorStore)

router.get("/getProductsByStoreId/:storeId",getProductsByStoreId)

router.get("/faqs", getAllFaqs);

router.post("/faqs", createFaq);

router.delete("/faqs/:id", deleteFaq);

router.get("/terms", getTerms);

router.post("/terms", createTerms);

router.delete("/terms/:id", deleteTerms);


export default router;
       