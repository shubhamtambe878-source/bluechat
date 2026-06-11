const cloudinary = require("cloudinary").v2;
const cloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer-storage-cloudinary v2 exports a factory function directly
const storage = cloudinaryStorage({
  cloudinary,
  folder: "chatapp",
  allowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm", "mp3", "wav", "m4a", "pdf", "doc", "docx", "txt"],
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname.replace(/\.[^/.]+$/, "")}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = { upload, cloudinary };
