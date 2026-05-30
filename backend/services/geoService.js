const axios = require("axios");

// Private/reserved IP ranges — no point hitting the API for these
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$|::1$|^fc|^fd)/;

const getLocation = async (ip) => {
  if (!ip || ip === "Unknown" || PRIVATE_IP.test(ip)) {
    return "Local";
  }

  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000
    });

    if (res.data.status === "fail") {
      return "Unknown";
    }

    const { city, country } = res.data;
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    return "Unknown";

  } catch {
    return "Unknown";
  }
};

module.exports = { getLocation };
