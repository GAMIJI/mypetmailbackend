import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import Category from "../models/Category.js";
import bcrypt from "bcryptjs";
import generateOtp from "../utils/generateOtp.js";
import fs from "fs";
import path from "path";
import Appointment from "../models/Appointment.js";
import DocReview from "../models/DocReview.js";
import Cart from "../models/Cart.js";
import Order from '../models/Order.js';


import Product from "../models/AddProduct.js";
import AddStore from "../models/AddStore.js";


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


export const getAllProducts = async (req, res) => {
  try {
    const { search = "", page = 1, limit = "6", category, minPrice, maxPrice } = req.query;

    const query = {
      $or: [
        { productName: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ]
    };

    // Category filtering (supports multiple values)
    if (category && category !== "all") {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id);


    // Validate the ID format
    // if (!id || id.length !== 24) {
    //   return res.status(400).json({ error: "Invalid product ID" });
    // }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: "userId, productId, and quantity are required" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create a new cart
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
      });
    } else {
      // Check if the product already exists
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists, replace quantity
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Add new product
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    return res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get cart with populated product info
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id; // Make sure user ID is available via middleware

    const cart = await Cart.findOne({ userId })
      .populate("items.productId") // populate full product info
      .exec();

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "userId and productId are required" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Filter out the item to remove
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    await cart.save();

    return res.status(200).json({ message: "Item removed from cart successfully", cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ error: "Internal server error" });
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

// place order 
export const placeOrder = async (req, res) => {
  try {
    const { products, address, paymentMode, totalAmount } = req.body;

    const productArray = Array.isArray(products) ? products : [products];

    if (productArray.length === 0) {
      return res.status(400).json({ message: 'No products provided in the order.' });
    }

    // Validate and fetch all products
    const fetchedProducts = await Promise.all(
      productArray.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found with ID: ${item.productId}`);
        }

        return {
          product: product._id,
          quantity: item.quantity,
          vendor: product.userId,
        };
      })
    );

    // Ensure all products are from the same vendor
    const vendorIds = [...new Set(fetchedProducts.map(p => p.vendor.toString()))];
    if (vendorIds.length > 1) {
      return res.status(400).json({ message: 'All products in a single order must belong to the same vendor.' });
    }

    // Create and save order
    const order = new Order({
      user: req.user.id,
      vendor: fetchedProducts[0].vendor,
      products: fetchedProducts.map(({ product, quantity }) => ({ product, quantity })),
      paymentMode,
      address,
      totalAmount,
    });


    await order.save();

    // Populate product details in the response
    const populatedOrder = await Order.findById(order._id)
      .populate('products.product') // populate product details
      .populate('user', 'name email') // optional: populate user
      .populate('user', 'storeName email'); // optional: populate vendor/store

    res.status(201).json({ message: 'Order placed successfully', order: populatedOrder });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// update order status
// User confirms or cancels
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById({ _id: req.params.id, user: req.user.id });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Restrict user from canceling after dispatch
    if (status === 'Cancelled' && order.status === 'Dispatched') {
      return res.status(400).json({ message: 'Cannot cancel order after dispatch' });
    }

    // User can only mark as Completed if it was Dispatched
    if (status === 'Completed' && order.status !== 'Dispatched') {
      return res.status(400).json({ message: 'Cannot complete order before dispatch' });
    }

    order.status = status;
    await order.save();

    res.json({ message: `Order ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', err });
  }
};

export const getUserOrdersByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const validStatuses = ['Placed', 'Dispatched', 'Completed', 'Cancelled'];
    const filter = {
      user: userId,
    };

    if (status && validStatuses.includes(status)) {
      filter.status = status;
    } else {
      filter.status = { $in: validStatuses }; // default: all
    }

    const orders = await Order.find(filter).populate('products.product');

    res.json({ orders });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllStores = async (req, res) => {
  try {
    const stores = await AddStore.find();

    res.status(200).json({ stores });
  } catch (error) {
    console.error("Error fetching all stores:", error);
    res.status(500).json({ error: "Failed to fetch stores." });
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
import mongoose from 'mongoose';

export const getUserOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('products.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderDetails = {
      orderId: order._id,
      user: order.user,
      status: order.status,
      paymentMode: order.paymentMode,
      createdAt: order.createdAt,
      products: order.products.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        images: item.product.images,
        description: item.product.description,
      })),
    };

    res.status(200).json({ success: true, order: orderDetails });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


export const getOrderDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Fetch order with user, vendor, and product details populated
    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone')
      .populate('products.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Format the order response
    const orderDetails = {
      orderId: order._id,
      status: order.status,
      paymentMode: order.paymentMode,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      vendor: order.vendor,
      address: order.address,
      products: order.products.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        images: item.product.images,
        quantity: item.quantity,
      })),
    };

    res.status(200).json({ success: true, order: orderDetails });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};