// controllers/categoryController.js
import Admin from "../models/Admin.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

import PrivacyPolicy from "../models/PrivacyPolicy.js";
import AddStore from "../models/AddStore.js";
import Product from "../models/AddProduct.js";
import Faq from "../models/Faq.js";
import Terms from "../models/Terms.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET


export const registerAdmin = async (req, res) => {

  const { name, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
  // res.status(201).json({ message: 'Admin registered successfully' });
}

// admin login 
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Login successful', token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
    console.log(error);

  }

  //  res.status(201).json({ message: 'Admin registered successfully' });
}

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


export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.query;  // get id from request body
    console.log(id);


    if (!id) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Server error" });
    console.log(err);

  }


};


export const privacyPolicy = async (req, res) => {
  try {
    let policy = await PrivacyPolicy.findOne();

    // If no policy exists, create a default one
    if (!policy) {
      const newPolicy = new PrivacyPolicy({
        content: `At Sunshine Mart, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our store or website.

1. Information We Collect
We may collect personal information such as your name, email address, phone number, and payment details when you make a purchase or sign up for our services.

2. How We Use Your Information
We use your information to process transactions, provide customer support, improve our services, and send promotional offers. We will not sell or rent your personal information to third parties.

3. Cookies and Tracking
Our website uses cookies to enhance your browsing experience. Cookies help us understand user behavior and improve our website functionality.

4. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or disclosure.

5. Your Rights
You have the right to access, update, or delete your personal information. To exercise these rights, please contact us at contact@sunshinemart.com.

6. Changes to This Policy
We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated revision date.

If you have any questions or concerns about our Privacy Policy, please reach out to us at contact@sunshinemart.com. add by adminp`,
      });

      await newPolicy.save();
      policy = newPolicy; // assign saved policy to use in response
    }

    res.json({
      content: policy.content,
      lastUpdated: policy.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const privacyPolicyUpdate = async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Privacy policy content is required" });
  }

  try {
    let policy = await PrivacyPolicy.findOne();
    if (!policy) {
      policy = new PrivacyPolicy({ content });
    } else {
      policy.content = content;
      policy.lastUpdated = new Date();
    }
    await policy.save();

    res.json({
      message: "Privacy policy updated successfully",
      lastUpdated: policy.lastUpdated,
    });
  } catch (error) {
    console.error("Error updating privacy policy:", error);
    res.status(500).json({ message: "Server error" });
  }
}


export const getVendorStore = async (req, res) => {
  try {
    2
    const vendorId = req.params.id;  // get vendor id from URL params

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required in params." });
    }

    // Assuming AddStore model has a field `userId` that references vendor
    const store = await AddStore.findOne({ userId: vendorId });

    if (!store) {
      return res.status(404).json({ error: "Store not found for this vendor." });
    }

    res.status(200).json({ store });

  } catch (error) {
    console.error("Error fetching vendor store:", error);
    res.status(500).json({ error: "Failed to fetch store details." });
  }
};


export const getProductsByStoreId = async (req, res) => {
  try {
    const storeId = req.params.storeId;

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const products = await Product.find({ storeId });

    res.status(200).json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};




// Get all FAQs
export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({ isActive: true });
    res.status(200).json({ faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs." });
  }
};

// Add a new FAQ
export const createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer are required." });
    }

    const faq = new Faq({ question, answer });
    await faq.save();

    res.status(201).json({ message: "FAQ created successfully", faq });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({ error: "Failed to create FAQ." });
  }
};

// Delete FAQ
export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    await Faq.findByIdAndDelete(id);

    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ." });
  }
};




// Get latest active Terms
export const getTerms = async (req, res) => {
  try {
    const terms = await Terms.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!terms) {
      return res.status(404).json({ error: "Terms and Conditions not found." });
    }

    res.status(200).json({ terms });
  } catch (error) {
    console.error("Error fetching terms:", error);
    res.status(500).json({ error: "Failed to fetch Terms and Conditions." });
  }
};

// Add new Terms
export const createTerms = async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }

    const terms = new Terms({ title, content });
    await terms.save();

    res.status(201).json({ message: "Terms and Conditions created successfully", terms });
  } catch (error) {
    console.error("Error creating terms:", error);
    res.status(500).json({ error: "Failed to create Terms and Conditions." });
  }
};

// Delete Terms (by ID)
export const deleteTerms = async (req, res) => {
  try {
    const { id } = req.params;

    await Terms.findByIdAndDelete(id);

    res.status(200).json({ message: "Terms and Conditions deleted successfully" });
  } catch (error) {
    console.error("Error deleting terms:", error);
    res.status(500).json({ error: "Failed to delete Terms and Conditions." });
  }
};
