import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteConversation, deleteMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

// Delete conversation between logged in user and user with :id
router.delete("/:id", protectRoute, deleteConversation);

// Delete a single message by id
router.delete("/message/:id", protectRoute, deleteMessage);

export default router;
