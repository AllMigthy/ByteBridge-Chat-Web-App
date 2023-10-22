const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  acceptChatRequest, // New route to accept requests
  rejectChatRequest, // New route to reject requests
  getPendingRequests
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Access chat (individual or create new)
router.route("/request").post(protect, accessChat);

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

// accepts a chat request
router.route("/accept/:requestId").patch(protect, acceptChatRequest);

// rejects a chat request
router.route("/reject/:requestId").patch(protect, rejectChatRequest);

router.get("/pending-requests", protect, getPendingRequests);

module.exports = router;
