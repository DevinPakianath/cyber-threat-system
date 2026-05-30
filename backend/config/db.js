const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Trying to connect to MongoDB...");

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("MongoDB Connected ✅");
    console.log("Host:", conn.connection.host);

  } catch (error) {
    console.error("DB Error ❌:", error.message);
    throw error;
  }
};

module.exports = connectDB;