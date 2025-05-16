// routes/categoryRoutes.js
import express from "express";
import { addCategory, getCategories, getUsersByRole } from "../controllers/adminController.js";

const router = express.Router();

router.post("/addcategory", addCategory);   // Public or protected (your choice)
router.get("/categories", getCategories);    // Fetch all

router.get("/getuserbyrole",getUsersByRole)

export default router;
