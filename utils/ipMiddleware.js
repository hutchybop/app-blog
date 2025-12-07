const geoip = require('geoip-lite');

// Simple IP middleware to replace express-ip
const getIpInfoMiddleware = (req, res, next) => {
    // Get the client IP address
    const ip = req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Clean up IPv6-mapped IPv4 addresses
    const cleanIp = ip && ip.includes('::ffff:') ? ip.replace('::ffff:', '') : ip;
    
    // Get geo information
    const geo = geoip.lookup(cleanIp);
    
    // Attach to request object
    req.ipInfo = {
        ip: cleanIp,
        country: geo ? geo.country : null,
        region: geo ? geo.region : null,
        city: geo ? geo.city : null,
        timezone: geo ? geo.timezone : null,
        ll: geo ? geo.ll : null
    };
    
    next();
};

module.exports = { getIpInfoMiddleware };