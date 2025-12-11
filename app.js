if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// required packages
const express = require("express");
const path = require("path");
const { mongoose } = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const back = require("express-back");

const helmet = require("helmet");
const { getIpInfoMiddleware } = require("./utils/ipMiddleware");
const { trackRequest } = require("./utils/tracker");
const { checkBlockedIP } = require("./utils/blockedIPMiddleware");
const compression = require("compression");
const {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  reviewLimiter,
} = require("./utils/rateLimiter");

// database lookup for blockedIPs

// Required for recaptcha
const Recaptcha = require("express-recaptcha").RecaptchaV2;
const recaptcha = new Recaptcha(process.env.SITEKEY, process.env.SECRETKEY, {
  callback: "cb",
});

// requires modules.exports
const policy = require("./controllers/policy");
const users = require("./controllers/users");
const reviews = require("./controllers/reviews");
const blogsIM = require("./controllers/blogsIM");
const admin = require("./controllers/admin");

const { errorHandler } = require("./utils/errorHandler");
const catchAsync = require("./utils/catchAsync");
const {
  validateTandC,
  validateLogin,
  validateRegister,
  validateForgot,
  validateReset,
  validateDetails,
  validateDelete,
  validateReview,
  isReviewAuthor,
  isLoggedIn,
  isAdmin,
  populateUser,
} = require("./utils/middleware");

// setting up express
const app = express();

// If in production, tells express about nginx proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// setting up mongoose
const dbUrl = [
  "mongodb+srv://hutch:",
  process.env.MONGODB,
  "@hutchybop.kpiymrr.mongodb.net/blog?",
  "retryWrites=true&w=majority&appName=hutchyBop",
].join("");

mongoose.connect(dbUrl);

// Error Handling for the db connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
// Allows us to add HTTP verbs other than post
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
// Helps to stop mongo injection by not allowing certain characters in the query string
// Custom mongo sanitize middleware for Express 5 compatibility
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === "string") {
          sanitized[key] = obj[key].replace(/\$/g, "");
        } else if (typeof obj[key] === "object") {
          sanitized[key] = sanitize(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  // Sanitize query, body, and params
  req.query = sanitize(req.query);
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);

  next();
});

// Helmet protects again basic security holes.
app.use(helmet());

// Setting up helmet to allow certain scripts/stylesheets
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.jsdelivr.net/",
  "https://code.jquery.com/",
  "https://www.google.com/recaptcha/",
  "https://www.gstatic.com/recaptcha/",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net/",
  "https://cdnjs.cloudflare.com/",
  "https://fonts.gstatic.com",
  "https://fonts.googleapis.com/",
];
const imgSrcUrls = [];
const connectSrcUrls = [
  "https://cdn.jsdelivr.net/",
  "https://code.jquery.com/",
  "https://cdnjs.cloudflare.com/",
  "https://fonts.googleapis.com/",
  "https://fonts.gstatic.com",
  "https://www.google.com/recaptcha/",
  "https://www.gstatic.com/recaptcha/",
];
const fontSrcUrls = [
  "https://cdnjs.cloudflare.com/",
  "https://fonts.gstatic.com",
  "https://fonts.googleapis.com/",
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
    },
  }),
);

//setting up session
const sessionConfig = {
  name: "blog_longrunner",
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS
    sameSite: "strict", // Protect against CSRF
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || dbUrl,
  }),
};
app.use(session(sessionConfig));

// Required after session setup.
app.use(flash());
app.use(back());

// Custom authentication middleware to populate user from session
app.use(populateUser);

// Setting up IP middleware
app.use(getIpInfoMiddleware);

// Blocked IP middleware - check before tracking
app.use(checkBlockedIP);

// Tracker middleware - place after IP middleware but before compression
app.use(trackRequest);

// Compression to make website run quicker
app.use(compression());

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Middleware to set local variables and handle user session data
app.use(async (req, res, next) => {
  // console.log(`${req.method} ${req.url} - middleware hit`); // Commented out to reduce console noise
  res.locals.currentUser = req.user;
  // Setting up flash
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  // // Setting up tracker log
  // myLogger(req, res, next)
  // if(String(req.secure) == process.env.REQ_SECURE){
  //     return res.redirect('https://' + req.headers.host + req.url)
  // }

  next();
});

// policy routes
app.get("/policy/cookie-policy", policy.cookiePolicy);
app.get("/policy/tandc", recaptcha.middleware.render, policy.tandc);
app.post(
  "/policy/tandc",
  recaptcha.middleware.verify,
  validateTandC,
  policy.tandcPost,
);
app.get("/policy/logs", catchAsync(policy.logs));

// auth routes (new /auth prefix)
app.get("/auth/register", users.register);
app.post(
  "/auth/register",
  registrationLimiter,
  validateRegister,
  catchAsync(users.registerPost),
);
app.get("/auth/login", users.login);
app.post(
  "/auth/login",
  authLimiter,
  validateLogin,
  require("./utils/auth").authenticateUser,
  catchAsync(async (req, res) => {
    await require("./utils/auth").loginUser(req, req.user);
    req.flash("success", "Welcome back!");
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }),
);
app.get("/auth/logout", users.logout);
app.get("/auth/forgot", (req, res, next) => {
  return users.forgot(req, res, next);
});
app.post(
  "/auth/forgot",
  passwordResetLimiter,
  validateForgot,
  catchAsync(users.forgotPost),
);
app.get("/auth/reset/:token", users.reset);
app.post("/auth/reset/:token", validateReset, catchAsync(users.resetPost));
app.get("/auth/details", isLoggedIn, users.details);
app.post("/auth/details", validateDetails, catchAsync(users.detailsPost));
app.get("/auth/delete-pre", isLoggedIn, users.deletePre);
app.delete("/auth/delete", isLoggedIn, validateDelete, users.delete);

// review routes
app.post(
  "/blogim/:id/reviews",
  reviewLimiter,
  validateReview,
  catchAsync(reviews.create),
);
app.delete(
  "/blogim/:id/reviews/:reviewId",
  isReviewAuthor,
  isLoggedIn,
  catchAsync(reviews.delete),
);
app.get("/blogim/:id/reviews", reviews.reviewLogin);

// Admin dashboard route
app.get("/admin", isLoggedIn, isAdmin, catchAsync(admin.dashboard));

// Admin routes for content moderation
app.get(
  "/admin/flagged-reviews",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.flaggedReviews),
);
app.post(
  "/admin/flagged-reviews/:reviewId/:action",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.updateFlaggedReview),
);

// Admin routes for all reviews management
app.get(
  "/admin/all-reviews",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.allReviews),
);
app.post(
  "/admin/all-reviews/:reviewId/delete",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.deleteReviewWithReason),
);

// Admin routes for post management
app.get("/admin/posts", isLoggedIn, isAdmin, catchAsync(admin.posts));
app.get("/admin/posts/new", isLoggedIn, isAdmin, catchAsync(admin.newPost));
app.post("/admin/posts", isLoggedIn, isAdmin, catchAsync(admin.createPost));
app.get(
  "/admin/posts/:id/edit",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.editPost),
);
app.put("/admin/posts/:id", isLoggedIn, isAdmin, catchAsync(admin.updatePost));
app.delete(
  "/admin/posts/:id",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.deletePost),
);

// Admin tracker analytics routes
app.get("/admin/tracker", isLoggedIn, isAdmin, catchAsync(admin.tracker));

// Admin blocked IP management routes
app.get(
  "/admin/blocked-ips",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.blockedIPs),
);
app.post("/admin/block-ip", isLoggedIn, isAdmin, catchAsync(admin.blockIP));
app.delete(
  "/admin/unblock-ip/:ip",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.unblockIP),
);

// blogIM routes (public only)
app.get("/", catchAsync(blogsIM.index));
app.get("/blogim/:id", catchAsync(blogsIM.show));

// Site-Map route
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "views/policy/sitemap.xml"));
});

// Unknown (404) webpage error
app.use((req, res) => {
  res.status(404).render("policy/error", {
    err: { message: "Page Not Found", statusCode: 404 },
    title: "Error - Page Not Found",
    page: "error",
  });
});

// Tracker middleware - place after IP middleware but before compression
app.use(trackRequest);

// Error Handler, from utils.
app.use(errorHandler);

// Start server on port 3004 using HTTP
app.listen(3004, () => {
  console.log("Server listening on PORT 3004");
});
