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
  max: 200, // Limit each IP to 100 requests per windowMs
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
  max: 10, // Limit each IP to 5 auth attempts per windowMs
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
  max: 5, // Limit each IP to 3 password reset requests per hour
  handler: passwordResetRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom handler for registration rate limit exceeded
const registrationRateLimitHandler = (req, res) => {
  req.flash("error", "Too many registration attempts, please try again later.");
  return res.redirect("/auth/register");
};

// Registration rate limiter
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 3 registration attempts per hour
  handler: registrationRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom handler for review rate limit exceeded
const reviewRateLimitHandler = (req, res) => {
  req.flash(
    "error",
    "Too many review submissions, please wait before posting another review.",
  );
  return res.redirect("back");
};

// Review submission rate limiter
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 reviews per 15 minutes
  handler: reviewRateLimitHandler,
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
  registrationLimiter,
  reviewLimiter,
};
