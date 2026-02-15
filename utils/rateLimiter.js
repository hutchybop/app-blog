const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  req.flash("error", "Too many requests, please try again later.");
  return res.redirect("back");
};

// General rate limiter for most endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP requests per windowMs
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom handler for auth rate limit exceeded
const authRateLimitHandler = (req, res) => {
  req.flash(
    "error",
    "Too many authentication attempts, please try again later.",
  );
  return res.redirect("/auth/login");
};

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP auth attempts per windowMs
  handler: authRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Custom handler for password reset rate limit exceeded
const passwordResetRateLimitHandler = (req, res) => {
  req.flash(
    "error",
    "Too many password reset attempts, please try again later.",
  );
  return res.redirect("/auth/forgot");
};

// Password reset rate limiter (even more restrictive)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP password reset requests per hour
  handler: passwordResetRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom handler for form sumissions rate limit exceeded
const formSubmissionRateLimitHandler = (req, res) => {
  req.flash("error", "Too many submissions, please wait before trying again.");
  return res.redirect("back");
};

// Form sumissions rate limiter
const formSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP reviews per 15 minutes
  handler: formSubmissionRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP for anonymous users, user ID for logged-in users
    return req.user ? `user_${req.user._id}` : ipKeyGenerator(req);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  formSubmissionLimiter,
};
