import Product from "../models/AddProduct.js";
import AddStore from "../models/AddStore.js";

export const addStore = async (req, res) => {
  try {
        const userId = req.user?.id || req.user?._id;
    const {
      storeName,
      storeAddress,
      storeOwner,
      contactNumber,
      storeEmail
    } = req.body;

    if (!storeName || !storeAddress || !storeOwner || !contactNumber || !storeEmail) {
      return res.status(400).json({ error: "All fields are required" });
    }


     // Get store image paths (if uploaded)
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
      storeImages
    });
   console.log(newStore);
   
    await newStore.save();
    res.status(201).json({ message: "Store added successfully", newStore });

  } catch (error) {
    console.error("Error adding store:", error);
    res.status(500).json({ error: "Failed to add store" });
}

};


export const addProduct = async (req, res) => {
  try {
    
        const userId = req.user?.id || req.user?._id;
    const { productName, productDescription, price, category,stock,brand } = req.body;

    if (!productName || !productDescription || !price || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const productImages = req.files?.productImages?.map(file =>
      file.path.replace(/\\/g, "/")
    ) || [];

    const newProduct = new Product({
      userId,
      productName,
      productDescription,
      price,
      stock,
      category,
      brand,  
      productImages,
    });
console.log(newProduct);

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
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
