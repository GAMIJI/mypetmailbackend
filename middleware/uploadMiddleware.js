import multer from "multer";
import path from "path";

// Storage configuration for all uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for profilePicture (images) and documents (images/pdf)
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
  const documentTypes = /pdf|doc|docx|jpeg|jpg|png/;

  const extname = documentTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = documentTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and documents are allowed."), false);
  }
};

// Create upload middleware
export const uploadFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "storeImages", maxCount: 10 },
  { name: "documents", maxCount: 10 },
  { name: "productImages", maxCount: 10 }
]);
