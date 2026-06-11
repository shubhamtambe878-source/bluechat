const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: 50,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: [/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, _ and ."],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "Hey there! I am using ChatApp",
    maxlength: 100,
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  socketId: {
    type: String,
    default: null,
  },
}, { timestamps: true });

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
