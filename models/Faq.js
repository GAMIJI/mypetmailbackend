import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
//   category: { type: String, default: "general" }, // optional
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model("Faq", faqSchema);
