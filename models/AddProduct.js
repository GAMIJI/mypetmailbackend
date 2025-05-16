import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    productDescription: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    productImages: {
      type: [String], // Array of image URLs or file paths
      //   required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // ratings: {
    //   type: Number,
    //   default: 0,
    // },
    // reviews: [
    //   {
    //     user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    //     comment: String,
    //     rating: Number,
    //     createdAt: { type: Date, default: Date.now },
    //   },
    // ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
