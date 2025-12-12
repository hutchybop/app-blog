const User = require("../models/user");
const Review = require("../models/review");

const { mail } = require("../utils/mail");
const PasswordUtils = require("../utils/passwordUtils");
const { loginUser, logoutUser } = require("../utils/auth");

// Register - User (GET)
module.exports.register = (req, res) => {
  res.render("users/register", {
    title: "Register at blog.longrunner.co.uk",
    css_page: "users",
    js_page: "register",
  });
};

// Register - User (POST)
module.exports.registerPost = async (req, res) => {
  if (req.body.tnc && req.body.tnc === "checked") {
    // Check if passwords match
    if (req.body.password !== req.body.confirm_password) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/auth/register");
    }

    const { email, username, password } = req.body;
    const user = await new User({ username, email });
    const registeredUser = await User.register(user, password);

    await loginUser(req, registeredUser);

    mail(
      "New User Registered on blog.longrunner.co.uk",
      "Hello,\n\n" +
        "A new User has registered! \n\n" +
        "Username: " +
        username,
    );

    req.flash("success", "You are logged in!");
    res.redirect("/");
  } else {
    req.flash("error", "You must accept the Terms and Conditions.");
    res.redirect("/auth/register");
  }
};

// login - user (GET)
module.exports.login = (req, res) => {
  res.render("users/login", {
    title: "Login to blog.longrunner.co.uk",
    css_page: "users",
  });
};

// login - user (POST)
module.exports.loginPost = async (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.returnTo || "/";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

// logout - user (GET)
module.exports.logout = async (req, res) => {
  req.flash("success", "Successfully logged out");
  try {
    await logoutUser(req);
  } catch (err) {
    req.flash("error", "Logout Error: " + err);
  }
  res.redirect("/");
};

// forgot - user (GET)
module.exports.forgot = (req, res) => {
  res.render("users/forgot", { title: "Password Reset" });
};

// forgot - user (POST)
module.exports.forgotPost = async (req, res) => {
  const token = PasswordUtils.generateResetToken();

  const foundUser = await User.findOne({ email: req.body.email });

  // Always show the same message to prevent account enumeration
  const successMessage =
    "If an account with that email address exists, a password reset link has been sent.";

  if (foundUser) {
    foundUser.resetPasswordToken = token;
    foundUser.resetPasswordExpires = PasswordUtils.generateResetTokenExpiry();
    foundUser.resetPasswordUsed = false; // Reset the used flag

    await foundUser.save();

    await mail(
      "blog.longrunner.co.uk Password Reset",
      "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
        "http://" +
        req.headers.host +
        "/auth/reset/" +
        token +
        "\n\n" +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n",
      foundUser.email,
    );
  }

  req.flash("success", successMessage);
  res.redirect("/auth/login");
};

// reset - user (GET)
module.exports.reset = async (req, res) => {
  const foundUser = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordUsed: { $ne: true },
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!foundUser) {
    req.flash(
      "error",
      "Password reset token is invalid, has been used, or has expired.",
    );
    return res.redirect("/auth/forgot");
  }

  res.render("users/reset", {
    token: req.params.token,
    title: "Reset Your Password",
  });
};

// reset - user (POST)
module.exports.resetPost = async (req, res) => {
  // Find user by token and check if token is unused and not expired
  const foundUser = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordUsed: { $ne: true },
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!foundUser) {
    req.flash(
      "error",
      "Password reset token is invalid, has been used, or has expired.",
    );
    return res.redirect("back");
  }

  // Check if passwords match
  if (req.body.password !== req.body.confirm_password) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("back");
  }

  // Set new password and invalidate token in one operation
  foundUser.password = await PasswordUtils.hashPassword(req.body.password);
  foundUser.resetPasswordToken = undefined;
  foundUser.resetPasswordExpires = undefined;
  foundUser.resetPasswordUsed = true; // Mark token as used
  foundUser.hash = undefined;
  foundUser.salt = undefined;

  await foundUser.save();
  await loginUser(req, foundUser);

  mail(
    "Your password has been changed for blog.longrunner.co.uk",
    "Hello,\n\n" +
      "This is a confirmation that the password for your account " +
      foundUser.email +
      " on blog.longrunner.co.uk has just been changed.\n",
    foundUser.email,
  );

  req.flash("success", "Success! Your password has been changed.");
  res.redirect("/");
};

// change user details (GET)
module.exports.details = (req, res) => {
  const username = req.user.username;
  const email = req.user.email;

  res.render("users/details", {
    username,
    email,
    title: "Reset Your Email Adrress",
  });
};

// change user details
module.exports.detailsPost = async (req, res) => {
  try {
    const { email, username } = req.body;
    const id = req.user._id;

    const foundEmail = await User.findOne({ email: req.body.email });
    const foundUsername = await User.findOne({ username: req.body.username });

    if (foundEmail != null) {
      if (foundEmail.id != id) {
        req.flash("error", "Email already registered");
        return res.redirect("/auth/details");
      }
    }

    if (foundUsername != null) {
      if (foundUsername.id != id) {
        req.flash("error", "Username already taken");
        return res.redirect("/auth/details");
      }
    }

    // checks if the password for the current user is correct
    const auth = await req.user.authenticate(req.body.password);

    if (auth.user !== false) {
      const updatedUser = await User.findByIdAndUpdate(id, {
        $set: {
          username: username,
          email: email,
        },
      });

      const detailsUser = await User.findById(id);

      mail(
        "Details Updated - blog.longrunner.co.uk",
        "Hello,\n\n" +
          "Your details on blog.longrunner.co.uk have been changed, your new details are:" +
          "\n\n" +
          `Email: ${detailsUser.email}` +
          "\n\n" +
          `Username: ${detailsUser.username}` +
          "\n\n" +
          "If you did not make these changes please conact info@longrunner.co.uk",
        detailsUser.email,
      );

      if (detailsUser.email != updatedUser.email) {
        mail(
          "Details Updated - blog.longrunner.co.uk",
          "Hello,\n\n" +
            "Your details on blog.longrunner.co.uk have been changed, your new details are:" +
            "\n\n" +
            `Email: ${detailsUser.email}` +
            "\n\n" +
            `Username: ${detailsUser.username}` +
            "\n\n" +
            "If you did not make these changes please conact info@longrunner.co.uk",
          updatedUser.email,
        );
      }

      // 307 allows re-direct to post route so the user is re-logged in with new details
      req.flash(
        "success",
        "Details updated, please log-in with new details. An email has been sent to confirm your new details",
      );
      res.redirect(307, "/auth/login");
    } else {
      req.flash(
        "error",
        "Password incorrect, no details changed. Please try again",
      );
      res.redirect("/auth/details");
    }
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/auth/login");
  }
};

// delete account (GET)
module.exports.deletePre = (req, res) => {
  if (req.user.username != "defaultMeals" && req.user.username != "anonymous") {
    const user = req.user;

    res.render("users/deletepre", {
      user,
      title: "Confirm DELETE account",
    });
  } else {
    req.flash("error", req.user.username + " cannot be deleted here");
    res.redirect("/");
  }
};

// delete account (POST)
module.exports.delete = async (req, res) => {
  // checks if the password for the current user is correct
  const auth = await req.user.authenticate(req.body.password);

  if (req.user.username != "defaultMeals" && req.user.username != "anonymous") {
    if (auth.user !== false) {
      const userEmail = req.user.email; // Store email before deletion

      await Review.deleteMany({ author: req.user._id });
      await User.findByIdAndDelete(req.user._id);

      // Clear the session after successful deletion
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
      });

      const message = encodeURIComponent(
        `Succesfully deleted Account for '${userEmail}'`,
      );
      res.redirect(`/?success=${message}`);

      mail(
        "Account deleted on blog.longrunner.co.uk",
        "Hello,\n\n" + "This is confirm that your account has been deleted",
        userEmail,
      );
    } else {
      req.flash("error", "Incorrect password, please try again");
      res.redirect("/auth/delete-pre");
    }
  } else {
    req.flash("error", req.user.username + " cannot be deleted here");
    res.redirect("/auth/delete-pre");
  }
};
