const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const ChatRequest = require("../Models/chatRequestModel");

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.user._id;

    if (!userId) {
      console.log("UserId param not sent with request");
      return res.sendStatus(400);
    }

    // Check if there's an existing chat request
    const existingRequest = await ChatRequest.findOne({
      sender: senderId,
      receiver: userId,
    });

    if (existingRequest) {
      // If a request exists, handle it based on its status
      if (existingRequest.status === "accepted") {
        // Chat request is accepted, proceed to fetch the chat
        const chat = await Chat.findById(existingRequest.chat)
          .populate("users", "-password")
          .populate("latestMessage");
        // Return the chat to the user
        return res.status(200).json(chat);
      } else if (existingRequest.status === "pending") {
        // Request is pending, inform the user
        return res.status(200).json({ message: "Request is pending" });
      } else {
        // Request is rejected, inform the user
        return res.status(200).json({ message: "Request is rejected" });
      }
    } else {
      // If no request exists, create a new pending chat request
      const chatRequest = await ChatRequest.create({
        sender: senderId,
        receiver: userId,
        status: "pending",
      });

      return res.status(200).json({ message: "Request sent" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchChats = async (req, res) => {
  try {
    const results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const resultsPopulated = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(resultsPopulated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Accept a chat request
const acceptChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the chat request document by ID and update its status to "accepted"
    const updatedRequest = await ChatRequest.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request Not Found" });
    }

    // Create a new chat associated with the request
    const chat = await Chat.create({
      chatName: "Chat Name", // You can customize this
      users: [updatedRequest.sender, updatedRequest.receiver],
      isGroupChat: false,
    });

    // Update the chat request with the reference to the chat
    updatedRequest.chat = chat._id;
    await updatedRequest.save();

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Reject a chat request
const rejectChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the chat request document by ID and update its status to "rejected"
    const updatedRequest = await ChatRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request Not Found" });
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).json({ message: "Please Fill all the fields" });
    }

    const users = req.body.users;

    if (users.length < 2) {
      return res
        .status(400)
        .json("More than 2 users are required to form a group chat");
    }

    users.push(req.user);

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(404).json({ error: "Chat Not Found" });
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      res.status(404).json({ error: "Chat Not Found" });
    } else {
      res.json(removed);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      res.status(404).json({ error: "Chat Not Found" });
    } else {
      res.json(added);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await ChatRequest.find({
      receiver: req.user._id, // Filter by the user ID of the currently authenticated user
      status: 'pending',
    }).populate('sender', 'name email');

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  acceptChatRequest,
  rejectChatRequest,
  getPendingRequests
};
