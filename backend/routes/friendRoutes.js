const express = require("express");
const router = express.Router();
const {
  searchUser,
  sendRequest,
  listIncoming,
  listOutgoing,
  respond,
  listFriends,
  removeFriend,
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

router.get("/search", protect, searchUser);
router.post("/request", protect, sendRequest);
router.get("/requests/incoming", protect, listIncoming);
router.get("/requests/outgoing", protect, listOutgoing);
router.put("/requests/:id", protect, respond);
router.get("/list", protect, listFriends);
router.delete("/:friendId", protect, removeFriend);

module.exports = router;
