const express = require("express");
const router = express.Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  uploadMedia,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/cloudinary");

router.post("/upload", protect, upload.single("file"), uploadMedia);
router.get("/:userId", protect, getMessages);
router.post("/send/:userId", protect, sendMessage);
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;
