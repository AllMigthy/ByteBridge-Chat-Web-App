const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  acceptChatRequest, // New route for admin to accept requests
  rejectChatRequest, // New route for admin to reject requests
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Access chat (individual or create new)
router.route("/access").post(protect, accessChat);

// Fetch user's chats
router.route("/fetch").get(protect, fetchChats);

// Create a group chat
router.route("/group").post(protect, createGroupChat);

// Rename a group chat
router.route("/group/rename").put(protect, renameGroup);

// Remove a user from a group chat
router.route("/group/remove").put(protect, removeFromGroup);

// Add a user to a group chat
router.route("/group/add").put(protect, addToGroup);

// Admin accepts a chat request
router.route("/admin/accept/:requestId").put(protect, acceptChatRequest);

// Admin rejects a chat request
router.route("/admin/reject/:requestId").put(protect, rejectChatRequest);

module.exports = router;
