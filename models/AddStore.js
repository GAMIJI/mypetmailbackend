import mongoose from "mongoose";

const addStoreSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
    },
    storeAddress: {
      type: String,
      required: true,
    },
    storeOwner: {
      type: String,
      required: true,
    },
    storeEmail: {
      type: String,
      unique: true,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isVerified: { type: Boolean, default: false },
    storeImage: {
      type: String,
      default:
        "https://iconarchive.com/download/i107063/Flat-Design/User-Profile-2/user-profile-icon.ico",
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true,
    },
    storeImages: {
      type: [String],
      required: true
    },
    timings: {
      start: String,
      end: String,
    },
    consultationFee: Number,
    documents: [String],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
  },
  { timestamps: true }
);

const AddStore = mongoose.model("AddStore", addStoreSchema);
export default AddStore;
