const mongoose = require("mongoose");

const chatRequestSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["accepted", "rejected", "pending"],
      default: "pending",
    }, // Request status
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // Reference to the chat
  },
  
  { timestamps: true }
);

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);
module.exports = ChatRequest;
