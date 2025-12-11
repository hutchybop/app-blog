const Tracker = require("../models/tracker");
const { reviewIp } = require("./ipLookup");

const trackRequest = async (req, res, next) => {
  try {
    const skipPaths = [
      "/favicon.ico",
      "/stylesheets/",
      "/javascripts/",
      "/images/",
      "/manifest/",
      "/.well-known/",
    ];

    const shouldSkip = skipPaths.some((p) => req.path.startsWith(p));
    if (shouldSkip) return next();

    // Lookup IP data
    const { ip, countryName, cityName } = await reviewIp(req);
    const userAgent = req.get("User-Agent") || "UNKNOWN";

    let tracker = await Tracker.findOne({ ip });

    if (!tracker) {
      // Create new
      tracker = new Tracker({
        ip,
        country: countryName,
        city: cityName,
        userAgent,
        timesVisited: 1,
        isFirstVisit: true,
      });
    } else {
      // Update existing
      tracker.timesVisited++;
      tracker.lastVisitDate = new Date().toLocaleDateString("en-GB");
      tracker.lastVisitTime = new Date().toLocaleTimeString("en-GB", {
        hour12: false,
      });
      tracker.isFirstVisit = false;
      tracker.userAgent = userAgent;

      if (tracker.ip === "UNKNOWN" && ip !== "UNKNOWN") tracker.ip = ip;
      if (tracker.country === "UNKNOWN" && countryName !== "UNKNOWN")
        tracker.country = countryName;
      if (tracker.city === "UNKNOWN" && cityName !== "UNKNOWN")
        tracker.city = cityName;
    }

    // IMPORTANT: Save AFTER response is fully processed
    res.on("finish", async () => {
      try {
        if (req.route) {
          const url = req.route.path;
          const current = tracker.goodRoutes.get(url) || 0;
          tracker.goodRoutes.set(url, current + 1);
        } else {
          const url = req.originalUrl;
          const current = tracker.badRoutes.get(url) || 0;
          tracker.badRoutes.set(url, current + 1);
        }

        await tracker.save();
      } catch (err) {
        console.error("Failed to update tracker on finish:", err);
      }
    });
  } catch (error) {
    console.error("Tracker middleware error:", error);
  }

  next();
};

module.exports = { trackRequest };
