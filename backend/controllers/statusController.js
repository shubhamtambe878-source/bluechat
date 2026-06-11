const Status = require("../models/Status");
const User = require("../models/User");

exports.createStatus = async (req, res) => {
  try {
    const { text, mediaUrl, mediaType, background } = req.body;
    if (!text && !mediaUrl) {
      return res.status(400).json({ message: "Status must have text or media" });
    }

    const status = await Status.create({
      user: req.user._id,
      text: text || "",
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || (mediaUrl ? "image" : "text"),
      background: background || "#3b82f6",
    });

    const populated = await Status.findById(status._id).populate("user", "name username avatar");

    const io = req.app.get("io");
    const me = await User.findById(req.user._id);
    const onlineUsers = req.app.get("onlineUsers");
    me.friends.forEach((friendId) => {
      const sock = onlineUsers?.get(friendId.toString());
      if (io && sock) io.to(sock).emit("status:new", populated);
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const userIds = [req.user._id, ...(me.friends || [])];

    const statuses = await Status.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    const grouped = {};
    for (const s of statuses) {
      const uid = s.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: s.user,
          statuses: [],
          hasUnseen: false,
        };
      }
      grouped[uid].statuses.push(s);
      if (!s.viewers.some((v) => v.toString() === req.user._id.toString())) {
        grouped[uid].hasUnseen = true;
      }
    }

    const myUid = req.user._id.toString();
    const result = [];
    if (grouped[myUid]) result.push({ ...grouped[myUid], isMe: true });
    Object.entries(grouped).forEach(([uid, group]) => {
      if (uid !== myUid) result.push(group);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.viewStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: "Status not found" });

    if (!status.viewers.some((v) => v.toString() === req.user._id.toString())) {
      status.viewers.push(req.user._id);
      await status.save();
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ message: "Status not found" });
    if (status.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await status.deleteOne();
    res.json({ message: "Status deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
