import mongoose from "mongoose";

const termsSchema = new mongoose.Schema({
  title: { type: String, default: "Terms and Conditions" },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model("Terms", termsSchema);
