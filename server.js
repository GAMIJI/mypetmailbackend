import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js"
import adminRoutes from './routes/adminRoutes.js'


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
connectDB();

app.use(express.urlencoded({ extended: true }));
// Make uploads folder publicly accessible
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(errorHandler);

app.use("/api/user", userRoutes);

app.use("/api/vendor",vendorRoutes)

app.use("/api/admin",adminRoutes)


app.get("/", (req, res) => { 
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
