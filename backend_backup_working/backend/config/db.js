const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Trying to connect to MongoDB...");

  try {
    const conn = await mongoose.connect(
      "mongodb+srv://admin:admin123@sample.dwxwovi.mongodb.net/mydb?retryWrites=true&w=majority&appName=sample",
      {
        serverSelectionTimeoutMS: 5000
      }
    );

    console.log("MongoDB Connected ✅");
    console.log("Host:", conn.connection.host);

  } catch (error) {
    console.error("DB Error ❌:", error.message);
  }
};

module.exports = connectDB;