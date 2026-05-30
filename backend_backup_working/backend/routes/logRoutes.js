const express = require("express");
const router = express.Router();

const LoginLog = require("../models/LoginLog");

// GET ALL LOGS
router.get("/", async (req, res) => {

  try {

    const logs = await LoginLog.find()
      .sort({ timestamp: -1 });

    console.log("Logs Sent:", logs.length);

    // IMPORTANT
    // SEND PURE ARRAY
    res.json(logs);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }

});

module.exports = router;