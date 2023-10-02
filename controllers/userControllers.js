const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const allUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword)
      .select("-password") // Exclude the password field from the response
      .exec();
      console.log(users);
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Please Enter all the Fields" });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      pic,
      isAdmin: false, // Set the default isAdmin value
      role: "employee", // Set the default role (you can modify this as needed)
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        pic: user.pic,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        pic: user.pic,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: "Invalid Email or Password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { allUsers, registerUser, authUser };
