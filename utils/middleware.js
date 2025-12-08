const User = require("../models/user");
const Review = require("../models/review");
const {
  tandcSchema,
  loginSchema,
  registerSchema,
  forgotSchema,
  resetSchema,
  detailsSchema,
  deleteSchema,
  reviewSchema,
} = require("../models/schemas.js");
const catchAsync = require("./catchAsync");

// Function to send a Flash error instead of re-directing to error page
const JoiFlashError = (error, req, res, next, url) => {
  console.log("JoiFlashError called, error:", error);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    console.log("validation error message:", msg);
    if (process.env.NODE_ENV !== "production") {
      // Allows for generic message in production
      req.flash("error", `${msg}`);
    } else if (msg.includes("must not include HTML!")) {
      req.flash("error", "No HTML allowed, this includes, &, <, > ...");
    } else {
      req.flash(
        "error",
        "There has been a validation error, please try again.",
      );
    }
    console.log("redirecting to:", url);
    return res.redirect(`${url}`);
  } else {
    console.log("no validation error, calling next()");
    return next();
  }
};

// Uses Joi to validate user input for the contact form
module.exports.validateTandC = catchAsync(async (req, res, next) => {
  // tandcSchema is coming from the schemas.js file
  const { error } = tandcSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/policy/tandc");
});

// Uses Joi to validate user input for registration
// registerSchema is coming from the schemas.js file
module.exports.validateRegister = (req, res, next) => {
  // registerSchema is coming from the schemas.js file
  const { error } = registerSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/register");
};

// Uses Joi to validate user input for logging in
// loginSchema is coming from the schemas.js file
module.exports.validateLogin = (req, res, next) => {
  // loginSchema is coming from the schemas.js file
  const { error } = loginSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/login");
};

// Uses Joi to validate user input for forgot password form
// forgotSchema is coming from the schemas.js file
module.exports.validateForgot = (req, res, next) => {
  console.log("validateForgot called");
  // forgotSchema is coming from the schemas.js file
  const { error } = forgotSchema.validate(req.body);
  console.log("validation error:", error);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/forgot");
};

// Uses Joi to validate user input for reset password form
// resetSchema is coming from the schemas.js file
module.exports.validateReset = (req, res, next) => {
  // resetSchema is coming from the schemas.js file
  const { error } = resetSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, `/auth/reset/${req.params.token}`);
};

// Uses Joi to validate user input for changing details
// detailsSchema is coming from the schemas.js file
module.exports.validateDetails = (req, res, next) => {
  // detailsSchema is coming from the schemas.js file
  const { error } = detailsSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/details");
};

// Uses Joi to validate user input for changing details
// deleteSchema is coming from the schemas.js file
module.exports.validateDelete = (req, res, next) => {
  // deleteSchema is coming from the schemas.js file
  const { error } = deleteSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/details");
};

// Uses Joi to validate user input for review form
// reviewSchema is coming from the schemas.js file
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    req.flash("error", msg);
    return res.redirect("back");
  } else {
    return next();
  }
};

// Middleware to populate user from session
module.exports.isLoggedIn = (req, res, next) => {
  if (
    !req.user ||
    !req.session.userId ||
    !req.user._id.equals(req.session.userId)
  ) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in");
    return res.redirect("/auth/login");
  }
  next();
};

module.exports.populateUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    User.findById(req.session.userId)
      .then((user) => {
        if (!user) {
          // User not found in database, clear session
          delete req.session.userId;
        } else {
          req.user = user;
        }
        next();
      })
      .catch((err) => {
        console.error("Error populating user:", err);
        next();
      });
  } else {
    next();
  }
};

// Helper function to check if user is admin
const isAdminUser = (user) => {
  return user && user.role === "admin";
};

// Middleware to check if user is admin
module.exports.isAdmin = (req, res, next) => {
  if (!isAdminUser(req.user)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect("/");
  }
  next();
};

// Export helper for use in templates
module.exports.isAdminUser = isAdminUser;

// Middleware to check if user is review author
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/blogim/${id}`);
  }
  next();
};
