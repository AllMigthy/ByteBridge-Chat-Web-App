const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: { type: String }, // Add employee/staff roles here
    salary: { type: Number }, // Add employee/staff salary here
    designation: { type: String }, // Add employee/staff designation here
    joiningDate: { type: Date }, // Add joining date
    timeStayed: { type: Number }, // Add time stayed in milliseconds (you can calculate this)
    requestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatRequest" }], // Store sent chat requests
  },
  { timestamps: true }
);

// Method to compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware to hash the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Calculate the timeStayed based on joiningDate
userSchema.pre("save", function (next) {
  if (this.joiningDate) {
    const currentDate = new Date();
    const timeDiff = currentDate - this.joiningDate;
    this.timeStayed = timeDiff;
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
