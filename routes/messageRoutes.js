const express = require("express");
const { allMessages, sendMessage } = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Fetch all messages for a chat
router.route("/:chatId").get(protect, allMessages);

// Send a message
router.route("/").post(protect, sendMessage);

module.exports = router;
