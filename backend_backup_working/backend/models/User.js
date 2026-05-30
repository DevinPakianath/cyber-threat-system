const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,

  // Behavior profiling
  usualLoginHours: [Number],
  knownIPs: [String]
});

module.exports = mongoose.model("User", UserSchema);