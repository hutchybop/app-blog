// Error handler
/* eslint-disable no-unused-vars */
module.exports.errorHandler = (err, req, res, next) => {
  const { statusCode = 500 } = err;

  // Cast error
  if (err.name === "CastError") {
    req.flash("error", `${err.name} The information provided cannot be found!`);
    return res.back();
  }

  // Email error
  if (err.message === '"email" must be a valid email') {
    req.flash("error", "You need to enter a valid email address.");
    return res.redirect(req.originalUrl);
  }

  // Generic error
  if (!err.message) err.message = "Oh No, something went wrong.";

  res.status(statusCode).render("policy/error", {
    err,
    title: "Error - Something Went Wrong",
    page: "Error",
  });
};
