const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const initSocket = (io, onlineUsers) => {
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("token="))
          ?.split("=")[1];

      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`);

    onlineUsers.set(socket.userId, socket.id);
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id,
    });

    io.emit("user:online", { userId: socket.userId });
    socket.join(socket.userId);

    socket.on("message:send", async (data) => {
      try {
        const { receiverId, text, mediaUrl, mediaType, fileName, replyTo, tempId } = data;

        // Friend check
        const me = await User.findById(socket.userId).select("friends");
        const isFriend = (me.friends || []).some((f) => f.toString() === receiverId);
        if (!isFriend) {
          socket.emit("error", { message: "You can only chat with friends" });
          return;
        }

        let conversation = await Conversation.findOne({
          participants: { $all: [socket.userId, receiverId], $size: 2 },
        });
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [socket.userId, receiverId],
          });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender: socket.userId,
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
          $inc: { [`unreadCount.${receiverId}`]: 1 },
          updatedAt: new Date(),
        });

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message:receive", {
            ...populatedMessage.toObject(),
            conversationId: conversation._id,
          });
          await Message.findByIdAndUpdate(message._id, { status: "delivered" });
          socket.emit("message:status", {
            messageId: message._id,
            status: "delivered",
          });
        }

        socket.emit("message:sent", {
          tempId,
          message: populatedMessage,
          conversationId: conversation._id,
        });
      } catch (err) {
        console.error("message:send error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", ({ receiverId }) => {
      const sockId = onlineUsers.get(receiverId);
      if (sockId) io.to(sockId).emit("typing:start", { senderId: socket.userId });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      const sockId = onlineUsers.get(receiverId);
      if (sockId) io.to(sockId).emit("typing:stop", { senderId: socket.userId });
    });

    socket.on("message:read", async ({ conversationId, senderId }) => {
      try {
        await Message.updateMany(
          { conversationId, sender: senderId, status: { $ne: "read" } },
          { status: "read", $addToSet: { readBy: socket.userId } }
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          $set: { [`unreadCount.${socket.userId}`]: 0 },
        });
        const sockId = onlineUsers.get(senderId);
        if (sockId) {
          io.to(sockId).emit("message:read", {
            conversationId,
            readBy: socket.userId,
          });
        }
      } catch (err) {
        console.error("Read receipt error:", err);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`❌ Disconnected: ${socket.user.name}`);
      onlineUsers.delete(socket.userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen,
        socketId: null,
      });
      io.emit("user:offline", { userId: socket.userId, lastSeen });
    });
  });
};

module.exports = { initSocket };
