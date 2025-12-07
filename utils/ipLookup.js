const { getName } = require("country-list");
const geoip = require("geoip-lite");

module.exports.reviewIp = (req) => {
  let ip;
  let geo;
  let countryName;
  let cityName;

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
    ip = req.ipInfo.ip || req.ip || req.ips;
  }

  // looking up the ip address, country and city
  geo = geoip.lookup(ip) || "UNKNOWN";
  countryName = geo.country || "UNKNOWN";
  cityName = geo.city || "UNKNOWN";

  if (geo.country != undefined) {
    countryName = getName(geo.country);
  }

  return { ip, countryName, cityName };
};
