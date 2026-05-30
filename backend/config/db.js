const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Trying to connect to MongoDB...");

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // tolerate Atlas cold-start (was 5000)
      socketTimeoutMS:          45000, // drop hung sockets after 45 s
      maxPoolSize:              10,    // one process on Render free tier needs ~10
    });

    console.log("MongoDB Connected ✅");
    console.log("Host:", conn.connection.host);

  } catch (error) {
    console.error("DB Error ❌:", error.message);
    throw error;
  }
};

module.exports = connectDB;
