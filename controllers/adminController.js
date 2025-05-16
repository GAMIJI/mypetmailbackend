// controllers/categoryController.js
import Category from "../models/Category.js";
import User from "../models/User.js";

// POST: Add a new category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }

    const category = new Category({ name });
    await category.save();

    res.status(201).json({ message: "Category added", category });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET: Fetch all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role, search = "", page = 1, limit = 10 } = req.query;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const validRoles = ["admin", "vendor", "doctor", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role provided" });
    }

    const query = {
      role,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};





