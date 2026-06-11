const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

exports.searchUser = async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select("name username avatar bio isOnline")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username required" });

    const receiver = await User.findOne({ username: username.toLowerCase().trim() });
    if (!receiver) return res.status(404).json({ message: "User not found" });
    if (receiver._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const me = await User.findById(req.user._id);
    if (me.friends.some((f) => f.toString() === receiver._id.toString())) {
      return res.status(400).json({ message: "Already friends" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user._id },
      ],
      status: "pending",
    });
    if (existing) return res.status(400).json({ message: "Request already pending" });

    const request = await FriendRequest.create({
      sender: req.user._id,
      receiver: receiver._id,
    });

    const populated = await FriendRequest.findById(request._id)
      .populate("sender", "name username avatar")
      .populate("receiver", "name username avatar");

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const sockId = onlineUsers?.get(receiver._id.toString());
    if (io && sockId) io.to(sockId).emit("friend:request", populated);

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Request already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.listIncoming = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", "name username avatar bio")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listOutgoing = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    })
      .populate("receiver", "name username avatar bio")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respond = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (action === "accept") {
      request.status = "accepted";
      await request.save();
      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver },
      });
      await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender },
      });

      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      const senderSock = onlineUsers?.get(request.sender.toString());
      if (io && senderSock) io.to(senderSock).emit("friend:accepted", { by: req.user._id });

      return res.json({ message: "Friend added", request });
    }

    request.status = "rejected";
    await request.save();
    res.json({ message: "Request rejected", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .populate("friends", "name username avatar bio isOnline lastSeen");
    res.json(me.friends || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });
    res.json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
