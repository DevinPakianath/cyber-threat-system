const axios = require("axios");

const getLocation = async (ip) => {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    return res.data.country || "Unknown";
  } catch (error) {
    return "Unknown";
  }
};

module.exports = { getLocation };