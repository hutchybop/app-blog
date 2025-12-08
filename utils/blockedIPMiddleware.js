const BlockedIP = require("../models/blockedIP");

// Cache for blocked IPs to avoid frequent database queries
let blockedIPCache = new Set();
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Update blocked IP cache
const updateBlockedIPCache = async () => {
  try {
    const blocked = await BlockedIP.find();
    blockedIPCache = new Set();

    blocked.forEach((blockedDoc) => {
      if (
        blockedDoc.blockedIPArray &&
        Array.isArray(blockedDoc.blockedIPArray)
      ) {
        blockedDoc.blockedIPArray.forEach((ip) => {
          if (ip && typeof ip === "string") {
            blockedIPCache.add(ip.trim());
          }
        });
      }
    });

    lastCacheUpdate = Date.now();
    console.log(`Updated blocked IP cache with ${blockedIPCache.size} IPs`);
  } catch (error) {
    console.error("Error updating blocked IP cache:", error);
  }
};

// Middleware to check if IP is blocked
const checkBlockedIP = async (req, res, next) => {
  try {
    // Update cache if it's stale
    if (Date.now() - lastCacheUpdate > CACHE_TTL) {
      await updateBlockedIPCache();
    }

    // Get client IP
    let ip =
      req.ipInfo?.ip || req.ip || req.ips || req.connection.remoteAddress;

    // Clean up IPv6-mapped IPv4 addresses
    if (ip && ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    // Check if IP is blocked
    if (ip && blockedIPCache.has(ip)) {
      console.log(`Blocked IP attempted access: ${ip} to ${req.path}`);

      // Don't track blocked requests in the main tracker
      // But you could create a separate blocked tracker if needed

      return res.status(403).render("policy/error", {
        err: {
          message: "Access Denied",
          statusCode: 403,
          details:
            "Your IP address has been blocked due to suspicious activity.",
        },
        title: "Access Denied",
        page: "error",
      });
    }

    next();
  } catch (error) {
    console.error("Error in blocked IP middleware:", error);
    // If there's an error, allow the request to proceed
    next();
  }
};

// Function to manually add an IP to block list
const blockIP = async (ip) => {
  try {
    if (!ip || typeof ip !== "string") {
      throw new Error("Invalid IP address");
    }

    ip = ip.trim();

    let blocked = await BlockedIP.find();

    if (blocked.length > 0) {
      if (!blocked[0].blockedIPArray.includes(ip)) {
        blocked[0].blockedIPArray.push(ip);
        blocked[0].markModified("blockedIPArray");
        await blocked[0].save();
      }
    } else {
      await new BlockedIP({ blockedIPArray: [ip] }).save();
    }

    // Update cache immediately
    await updateBlockedIPCache();

    return true;
  } catch (error) {
    console.error("Error blocking IP:", error);
    return false;
  }
};

// Function to remove an IP from block list
const unblockIP = async (ip) => {
  try {
    if (!ip || typeof ip !== "string") {
      throw new Error("Invalid IP address");
    }

    ip = ip.trim();

    const blocked = await BlockedIP.find();

    if (blocked.length > 0) {
      const index = blocked[0].blockedIPArray.indexOf(ip);
      if (index > -1) {
        blocked[0].blockedIPArray.splice(index, 1);
        blocked[0].markModified("blockedIPArray");
        await blocked[0].save();

        // Update cache immediately
        await updateBlockedIPCache();

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error unblocking IP:", error);
    return false;
  }
};

// Function to get all blocked IPs
const getBlockedIPs = async () => {
  try {
    const blocked = await BlockedIP.find();
    const allBlockedIPs = [];

    blocked.forEach((blockedDoc) => {
      if (
        blockedDoc.blockedIPArray &&
        Array.isArray(blockedDoc.blockedIPArray)
      ) {
        allBlockedIPs.push(...blockedDoc.blockedIPArray);
      }
    });

    return allBlockedIPs;
  } catch (error) {
    console.error("Error getting blocked IPs:", error);
    return [];
  }
};

// Initialize cache on startup
updateBlockedIPCache();

module.exports = {
  checkBlockedIP,
  blockIP,
  unblockIP,
  getBlockedIPs,
  updateBlockedIPCache,
};
