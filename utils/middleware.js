const User = require("../models/user");
const catchAsync = require("./catchAsync");
const {
  // common schema
  tandcSchema,
  loginSchema,
  registerSchema,
  forgotSchema,
  resetSchema,
  detailsSchema,
  deleteSchema,
  // app specific schema
  reviewSchema,
} = require("../models/schemas.js");
const Review = require("../models/review");

/////////////////////////////Common validation/////////////////////////////

// Function to send a Flash error instead of re-directing to error page
const JoiFlashError = (error, req, res, next, url) => {
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
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
    // throw new ExpressError(msg, 400)
    // ExpressError will send the user to the error page
    return res.redirect(`${url}`);
  } else {
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

// Uses Joi to validate user input for logging in
module.exports.validateLogin = (req, res, next) => {
  // loginSchema is coming from the schemas.js file
  const { error } = loginSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/login");
};

// Uses Joi to validate user input for registration
module.exports.validateRegister = (req, res, next) => {
  // registerSchema is coming from the schemas.js file
  const { error } = registerSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/register");
};

// Uses Joi to validate user input for forgot password form
module.exports.validateForgot = (req, res, next) => {
  // forgotSchema is coming from the schemas.js file
  const { error } = forgotSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/forgot");
};

// Uses Joi to validate user input for reset password form
module.exports.validateReset = (req, res, next) => {
  // resetSchema is coming from the schemas.js file
  const { error } = resetSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, `/auth/reset/${req.params.token}`);
};

// Uses Joi to validate user input for changing details
module.exports.validateDetails = (req, res, next) => {
  // detailsSchema is coming from the schemas.js file
  const { error } = detailsSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/details");
};

// Uses Joi to validate user input for changing details
module.exports.validateDelete = (req, res, next) => {
  // deleteSchema is coming from the schemas.js file
  const { error } = deleteSchema.validate(req.body);
  // JoiFlashError function is defined above
  JoiFlashError(error, req, res, next, "/auth/details");
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
    await User.findById(req.session.userId)
      .then((user) => {
        if (!user) {
          // User not found in database, clear session
          delete req.session.userId;
          req.user = null;
        } else {
          req.user = user;
        }
        next();
      })
      .catch((err) => next(err));
  } else {
    next();
  }
};

/////////////////////////////App Specific validation/////////////////////////////

// Uses Joi to validate user input for review form
module.exports.validateReview = (req, res, next) => {
  // reviewSchema is coming from the schemas.js file
  const { error } = reviewSchema.validate(req.body);
  JoiFlashError(error, req, res, next, "/");
};

// Middleware to check if user is admin
module.exports.isAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    req.flash("error", "You do not have permission to do that");
    return res.redirect("/");
  }
  next();
};

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
