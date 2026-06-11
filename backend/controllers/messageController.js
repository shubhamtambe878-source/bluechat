const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const getOrCreateConversation = async (userId1, userId2) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId1, userId2],
    });
  }
  return conversation;
};

const assertFriendship = async (myId, otherId) => {
  const me = await User.findById(myId).select("friends");
  if (!me) return false;
  return (me.friends || []).some((f) => f.toString() === otherId.toString());
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    if (!(await assertFriendship(req.user._id, userId))) {
      return res.status(403).json({ message: "You can only chat with friends" });
    }

    const conversation = await getOrCreateConversation(req.user._id, userId);

    const messages = await Message.find({
      conversationId: conversation._id,
      isDeleted: false,
    })
      .populate("sender", "name username avatar")
      .populate("replyTo", "text sender mediaType")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: { $ne: req.user._id },
        status: { $ne: "read" },
      },
      { $set: { status: "read" }, $addToSet: { readBy: req.user._id } }
    );

    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: { [`unreadCount.${req.user._id}`]: 0 },
    });

    res.json({
      messages: messages.reverse(),
      conversationId: conversation._id,
      hasMore: messages.length === Number(limit),
    });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text, mediaUrl, mediaType, fileName, replyTo } = req.body;

    if (!text && !mediaUrl) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (!(await assertFriendship(req.user._id, userId))) {
      return res.status(403).json({ message: "You can only chat with friends" });
    }

    const conversation = await getOrCreateConversation(req.user._id, userId);

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      text: text || "",
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      fileName: fileName || null,
      replyTo: replyTo || null,
      status: "sent",
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar")
      .populate("replyTo", "text sender mediaType");

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      $inc: { [`unreadCount.${userId}`]: 1 },
      updatedAt: new Date(),
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.isDeleted = true;
    message.text = "This message was deleted";
    message.mediaUrl = null;
    message.mediaType = null;
    await message.save();

    res.json({ message: "Message deleted", _id: message._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let type = "file";
    if (req.file.mimetype.startsWith("image/")) type = "image";
    else if (req.file.mimetype.startsWith("video/")) type = "video";
    else if (req.file.mimetype.startsWith("audio/")) type = "audio";

    res.json({
      url: req.file.path,
      type,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
