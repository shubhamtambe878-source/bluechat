const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  text: {
    type: String,
    default: "",
    maxlength: 300,
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  mediaType: {
    type: String,
    enum: ["image", "video", "text", null],
    default: null,
  },
  background: {
    type: String,
    default: "#3b82f6",
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model("Status", statusSchema);
