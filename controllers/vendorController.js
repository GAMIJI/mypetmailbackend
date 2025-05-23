import Product from "../models/AddProduct.js";
import AddStore from "../models/AddStore.js";
import Category from "../models/Category.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Vendor from '../models/vendor.js'; // Adjust the path to your Vendor model
import jwt from 'jsonwebtoken';
import Order from "../models/Order.js";

// Get __dirname in ES module context (if using type: "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env variable in prod

export const registerVendor = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) return res.status(400).json({ message: 'Vendor already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({ name, email, password: hashedPassword });
    await newVendor.save();

    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const loginVendor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: vendor._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      vendor: { id: vendor._id, name: vendor.name, email: vendor.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
    console.log(error);
  }
};




export const addStore = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const {
      storeName,
      storeAddress,
      storeOwner,
      contactNumber,
      storeEmail,
    } = req.body;

    if (!storeName || !storeAddress || !storeOwner || !contactNumber || !storeEmail) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Check if this user has already added a store
    const existingStore = await AddStore.findOne({ userId });
    if (existingStore) {
      return res.status(400).json({ message: "You have already added a store" });
    }

    // ✅ Process uploaded images (if any)
    const storeImages = req.files?.storeImages?.map(file =>
      file.path.replace(/\\/g, "/")
    ) || [];

    const newStore = new AddStore({
      userId,
      storeName,
      storeAddress,
      storeOwner,
      contactNumber,
      storeEmail,
      storeImages,
    });

    await newStore.save();

    res.status(201).json({ message: "Store added successfully", newStore });

  } catch (error) {
    console.error("Error adding store:", error);

    // ✅ Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return res.status(400).json({
        message: `A store with this ${duplicateField} (${duplicateValue}) already exists.`,
      });
    }

    res.status(500).json({ error: "Failed to add store" });
  }
};

//get vendor store 
export const getVendorStore = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Vendor ID not found." });
    }

    const store = await AddStore.findOne({ userId });

    if (!store) {
      return res.status(404).json({ error: "Store not found for this vendor." });
    }

    res.status(200).json({ store });

  } catch (error) {
    console.error("Error fetching vendor store:", error);
    res.status(500).json({ error: "Failed to fetch store details." });
  }
};


export const addProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { productName, productDescription, price, category, stock, brand } = req.body;

    if (!productName || !productDescription || !price || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Get the storeId linked to the user
    const store = await AddStore.findOne({ userId });
    if (!store) {
      return res.status(400).json({ error: "You must create a store before adding products" });
    }

    const productImages = req.files?.productImages?.map(file =>
      file.path.replace(/\\/g, "/")
    ) || [];

    const newProduct = new Product({
      userId,
      storeId: store._id, // ✅ Attach storeId
      productName,
      productDescription,
      price,
      stock,
      category,
      brand,
      productImages,
    });

    await newProduct.save();

    res.status(201).json({ message: "Product added successfully", product: newProduct });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};
// update product     
export const updateProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const productId = req.params.id;
    const { productName, productDescription, price, category, stock, brand, existingImages } = req.body;

    if (!productName || !productDescription || !price || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Get the storeId linked to the user
    const store = await AddStore.findOne({ userId });
    if (!store) {
      return res.status(400).json({ error: "You must create a store before adding products" });
    }

    // Correctly access new uploaded images from req.files.productImages (array)
    const newImages = req.files?.productImages?.map(file => file.path.replace(/\\/g, "/")) || [];

    // Combine existing images with new ones
    let updatedImages = [];
    if (existingImages) {
      if (typeof existingImages === "string") {
        // If existingImages is a single string, convert to array
        updatedImages = [existingImages];
      } else if (Array.isArray(existingImages)) {
        updatedImages = existingImages;
      }
      // else leave updatedImages empty if existingImages is something else
    }

    // Add new images at the end
    updatedImages = [...updatedImages, ...newImages];

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, userId },
      {
        productName,
        productDescription,
        price,
        category,
        stock,
        brand,
        productImages: updatedImages,
        storeId: store._id,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getVendorProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: user ID not found" });
    }

    const products = await Product.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({ error: "Failed to fetch vendor products" });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Return raw stored paths (already formatted in addProduct)
    const rawImagePaths = (product.productImages || []).map(img => img.replace(/\\/g, '/'));

    res.status(200).json({
      _id: product._id,
      productName: product.productName,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      productDescription: product.productDescription,
      category: product.category,
      productImages: rawImagePaths,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const productId = req.body.id;
    console.log('Deleting product with ID:', productId);

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete images from filesystem safely
    if (product.productImages && product.productImages.length > 0) {
      for (const imagePath of product.productImages) {
        const cleanedPath = imagePath.replace(/^\/?public\/?/, '').replace(/\\/g, '/'); // normalize
        const filePath = path.resolve(process.cwd(), cleanedPath); // removed 'public'

        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          } else {
            console.warn(`File not found, skipping: ${filePath}`);
          }
        } catch (err) {
          console.warn(`Failed to delete image: ${filePath}`, err.message);
        }
      }

    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error while deleting product' });
  }
};
// product dispatch 
export const dispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Only update the status field
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Dispatched' },
      { new: true } // Return the updated document
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order dispatched successfully',
      order: {
        _id: order._id,
        status: order.status // Only return what we need
      }
    });
  } catch (err) {
    console.error('Error dispatching order:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
//get vendor orders
export const getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendor: req.user.id })
      .populate('products.product')  // populate each product inside products array
      .populate('user', 'name email'); // populate user info

    res.json(orders);
  } catch (err) {
    console.error('Error fetching vendor orders:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

