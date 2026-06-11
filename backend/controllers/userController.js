const User = require("../models/User");
const Conversation = require("../models/Conversation");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name username avatar bio isOnline lastSeen")
      .sort({ isOnline: -1, name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const { archived } = req.query;
    const meId = req.user._id;

    const baseQuery = { participants: meId };
    let conversations = await Conversation.find(baseQuery)
      .populate("participants", "name username avatar isOnline lastSeen bio")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name username" },
      })
      .sort({ updatedAt: -1 });

    conversations = conversations.filter((c) => {
      const isArchived = (c.archivedBy || []).some((id) => id.toString() === meId.toString());
      return archived === "true" ? isArchived : !isArchived;
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleArchive = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const isArchived = (conv.archivedBy || []).some((id) => id.toString() === req.user._id.toString());
    if (isArchived) {
      conv.archivedBy = conv.archivedBy.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      conv.archivedBy.push(req.user._id);
    }
    await conv.save();

    res.json({ archived: !isArchived });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
