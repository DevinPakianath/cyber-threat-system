const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },

    // Behaviour profiling — updated on each successful login
    usualLoginHours: [Number],
    knownIPs: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
