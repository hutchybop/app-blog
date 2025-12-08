const { getName } = require("country-list");
const geoip = require("geoip-lite");
const axios = require("axios");

module.exports.reviewIp = async (req) => {
  let ip;
  let countryName = "UNKNOWN";
  let cityName = "UNKNOWN";

  // Hardcodes my ip address in so it works in test mode
  if (process.env.NODE_ENV !== "production") {
    // returns a random ip address to sim multiple connections
    const ipChoice = [
      "5.70.37.177",
      "85.255.233.69",
      "93.177.74.181",
      "45.152.183.118",
      "122.155.174.76",
    ];
    const ranNum = Math.floor(Math.random() * 5);
    ip = ipChoice[ranNum];
  } else {
    ip = req.ipInfo?.ip || req.ip || req.ips || req.connection.remoteAddress;

    // Clean up IPv6-mapped IPv4 addresses
    if (ip && ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }
  }

  try {
    // Try multiple geo-location services for better accuracy
    let geo = null;

    // First try geoip-lite (fast, local)
    geo = geoip.lookup(ip);

    if (geo && geo.country) {
      countryName = getName(geo.country) || geo.country;
      cityName = geo.city || "UNKNOWN";
    } else {
      // Fallback to ip-api.com (free, no API key needed)
      try {
        const response = await axios.get(
          `http://ip-api.com/json/${ip}?fields=status,country,city`,
        );
        if (response.data && response.data.status === "success") {
          countryName = response.data.country || "UNKNOWN";
          cityName = response.data.city || "UNKNOWN";
        }
      } catch (apiError) {
        console.log("IP API fallback failed:", apiError.message);
      }
    }
  } catch (error) {
    console.log("Geo lookup failed:", error.message);
  }

  return { ip, countryName, cityName };
};
