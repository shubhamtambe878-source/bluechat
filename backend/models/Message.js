const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
    maxlength: 4000,
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  mediaType: {
    type: String,
    enum: ["image", "video", "audio", "file", "gif", "sticker", null],
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index for fast message retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);