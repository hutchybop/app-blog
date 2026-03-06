const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// Common options shared by all limiters
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Factory function to create limiters
function createLimiter({ windowMs, max, message, redirect, ...extra }) {
  return rateLimit({
    ...baseConfig,
    windowMs,
    max,
    handler: (req, res) => {
      req.flash("error", message);
      return res.redirect(redirect);
    },
    ...extra,
  });
}

// General limiter
const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
  redirect: "back",
});

// Auth limiter
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  redirect: "/auth/login",
  skipSuccessfulRequests: true,
});

// Password reset limiter
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts, please try again later.",
  redirect: "/auth/forgot",
});

// Form submission limiter
const formSubmissionLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many submissions, please wait before trying again.",
  redirect: "back",
  keyGenerator: (req) =>
    req.user ? `user_${req.user._id}` : ipKeyGenerator(req),
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  formSubmissionLimiter,
};
