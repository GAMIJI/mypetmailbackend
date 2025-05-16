// routes/categoryRoutes.js
import express from "express";
import { addCategory, getCategories, getUsersByRole } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/addCategory", addCategory);   // Public or protected (your choice)
router.get("/getCategories", getCategories);    // Fetch all

router.get("/getUsersByRole", getUsersByRole)

export default router;
