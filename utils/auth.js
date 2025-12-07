const User = require("../models/user");

// Custom authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    // Use generic error message to prevent account enumeration
    const genericError = "Invalid username or password";

    if (!user) {
      req.flash("error", genericError);
      return res.redirect("/login");
    }

    const auth = await user.authenticate(password);
    if (auth.user) {
      req.user = auth.user;
      return next();
    } else {
      req.flash("error", genericError);
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    // Log detailed error for debugging, show generic message to user
    if (process.env.NODE_ENV === "development") {
      req.flash("error", `Authentication failed: ${error.message}`);
    } else {
      req.flash("error", "Authentication failed");
    }
    return res.redirect("/login");
  }
};

// Custom login function to establish session
const loginUser = async (req, user) => {
  // Regenerate session to prevent session fixation
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user._id;
      req.user = user;
      resolve();
    });
  });
};

// Custom logout function
const logoutUser = async (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  authenticateUser,
  loginUser,
  logoutUser,
};