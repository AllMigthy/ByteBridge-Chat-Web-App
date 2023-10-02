const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const ChatRequest = require("../models/chatRequestModel");

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      console.log("UserId param not sent with request");
      return res.sendStatus(400);
    }

    // Check if there's an accepted chat request
    const acceptedRequest = await ChatRequest.findOne({
      sender: req.user._id,
      receiver: userId,
      status: "accepted",
    });

    if (acceptedRequest) {
      // Fetch the chat associated with the accepted request
      const chat = await Chat.findById(acceptedRequest.chat)
        .populate("users", "-password")
        .populate("latestMessage");

      const chatPopulated = await User.populate(chat, {
        path: "latestMessage.sender",
        select: "name pic email",
      });

      return res.status(200).json(chatPopulated);
    } else {
      // Check if there's a pending request
      const pendingRequest = await ChatRequest.findOne({
        sender: req.user._id,
        receiver: userId,
        status: "pending",
      });

      if (pendingRequest) {
        return res.status(200).json({ message: "Request is pending" });
      } else {
        // Create a new pending chat request
        const chatRequest = await ChatRequest.create({
          sender: req.user._id,
          receiver: userId,
          status: "pending",
        });

        return res.status(200).json({ message: "Request sent" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const acceptChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // Extract request ID from request parameters

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
      groupAdmin: req.user, // Set the admin as the admin of the chat
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


const fetchChats = async (req, res) => {
  try {
    const results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
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

const createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).json({ message: "Please Fill all the fields" });
    }

    const users = JSON.parse(req.body.users);

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

const rejectChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // Extract request ID from request parameters

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

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  acceptChatRequest,
  rejectChatRequest,
};
