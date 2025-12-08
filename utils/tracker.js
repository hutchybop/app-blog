const Tracker = require("../models/tracker");
const { reviewIp } = require("./ipLookup");

const trackRequest = async (req, res, next) => {
  try {
    // Skip tracking for static assets and API calls that don't need tracking
    const skipPaths = [
      "/favicon.ico",
      "/stylesheets/",
      "/javascripts/",
      "/images/",
      "/manifest/",
    ];

    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path));
    if (shouldSkip) {
      return next();
    }

    const { ip, countryName, cityName } = await reviewIp(req);
    const route = req.route ? req.route.path : req.path;
    const userAgent = req.get("User-Agent") || "UNKNOWN";

    // Determine if this is a good or bad request
    const isGoodRequest = res.statusCode < 400;

    // Find existing tracker entry or create new one
    let tracker = await Tracker.findOne({ ip });

    if (tracker) {
      // Update existing entry
      tracker.timesVisited += 1;
      tracker.lastVisitDate = new Date().toLocaleDateString("en-GB");
      tracker.lastVisitTime = new Date().toLocaleTimeString("en-GB", {
        hour12: false,
      });
      tracker.isFirstVisit = false;
      tracker.userAgent = userAgent;

      // Update route count
      const currentCount = tracker.routes.get(route) || 0;
      tracker.routes.set(route, currentCount + 1);

      // Update good/bad request counts
      if (isGoodRequest) {
        tracker.goodRequests += 1;
      } else {
        tracker.badRequests += 1;
      }

      await tracker.save();
    } else {
      // Create new entry
      const routes = new Map();
      routes.set(route, 1);

      tracker = new Tracker({
        ip,
        country: countryName,
        city: cityName,
        timesVisited: 1,
        routes: routes,
        userAgent: userAgent,
        isFirstVisit: true,
        goodRequests: isGoodRequest ? 1 : 0,
        badRequests: isGoodRequest ? 0 : 1,
      });

      await tracker.save();
    }

    // Attach tracker info to request for potential use in routes
    req.trackerInfo = tracker;
  } catch (error) {
    console.error("Tracker middleware error:", error);
    // Don't block the request if tracking fails
  }

  next();
};

module.exports = { trackRequest };
