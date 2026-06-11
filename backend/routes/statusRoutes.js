const express = require("express");
const router = express.Router();
const {
  createStatus,
  getFeed,
  viewStatus,
  deleteStatus,
} = require("../controllers/statusController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/cloudinary");

router.post("/upload", protect, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: req.file.path });
});

router.post("/", protect, createStatus);
router.get("/feed", protect, getFeed);
router.post("/:id/view", protect, viewStatus);
router.delete("/:id", protect, deleteStatus);

module.exports = router;
