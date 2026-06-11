const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getConversations,
  updateProfile,
  toggleArchive,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
router.get("/conversations", protect, getConversations);
router.put("/profile", protect, updateProfile);
router.put("/archive/:conversationId", protect, toggleArchive);

module.exports = router;
