import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({}).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteConversation = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // Ensure the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).json({ error: "User not found" });

    // Remove messages between the two users from the database
    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    });

    // Notify the other user (if online) that the conversation was deleted
    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chatDeleted", { by: String(myId) });
    }

    // Notify the requesting user to update their UI as well
    const mySocketId = getReceiverSocketId(String(myId));
    if (mySocketId) {
      io.to(mySocketId).emit("chatDeleted", { by: String(myId) });
    }

    res.status(200).json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.log("Error in deleteConversation controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a single message (only the sender can delete their message)
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const requesterId = String(req.user._id);

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // only the sender can delete the message
    if (String(message.senderId) !== requesterId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    // store receiver id to notify them
    const receiverId = String(message.receiverId);

    // delete the message
    await Message.deleteOne({ _id: messageId });

    // Notify both users that the message was deleted
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }

    // notify the sender (requester) as well
    const mySocketId = getReceiverSocketId(requesterId);
    if (mySocketId) {
      io.to(mySocketId).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.log("Error in deleteMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};