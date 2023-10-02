const express = require("express");
const {
  allUsers,
  registerUser,
  authUser,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Fetch all users
router.route("/").get(protect, allUsers);

// Register a new user
router.route("/register").post(registerUser);

// Authenticate user (login)
router.post("/login", authUser);

module.exports = router;
