const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const userPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  isOnline: user.isOnline,
  friends: user.friends || [],
  token,
});

exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const lowerUsername = username.toLowerCase().trim();
    const lowerEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: lowerEmail })) {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (await User.findOne({ username: lowerUsername })) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.create({
      name,
      username: lowerUsername,
      email: lowerEmail,
      password,
    });
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json(userPayload(user, token));
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.json(userPayload(user, token));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};
