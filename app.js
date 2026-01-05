if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// External Imports
const express = require("express");
const path = require("path");
const { mongoose } = require("mongoose");
const { MongoStore } = require("connect-mongo");
const mongoSanitize = require("express-mongo-sanitize");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const back = require("express-back");
const helmet = require("helmet");
const compression = require("compression");

// Required for recaptcha
const Recaptcha = require("express-recaptcha").RecaptchaV2;
const recaptcha = new Recaptcha(process.env.SITEKEY, process.env.SECRETKEY, {
  callback: "cb",
});

// Local imports
const { getIpInfoMiddleware } = require("./utils/ipMiddleware");
const { checkBlockedIP } = require("./utils/blockedIPMiddleware");
const { trackRequest } = require("./utils/tracker");
const {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  reviewLimiter,
} = require("./utils/rateLimiter");
const { authenticateUser, loginUser } = require("./utils/auth"); // Custom authentication
const flash = require("./utils/flash");
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

// Setting up mongoose
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

// Setting up the app
app.engine("ejs", ejsMate); // Tells express to use ejsmate for rendering .ejs html files
app.set("view engine", "ejs"); // Sets ejs as the default engine
app.set("views", path.join(__dirname, "views")); // Forces express to look at views directory for .ejs files
app.use(express.urlencoded({ extended: true })); // Makes req.body available
app.use(methodOverride("_method", { methods: ["POST", "GET"] })); // Allows us to add HTTP verbs other than post
app.use(express.static(path.join(__dirname, "/public"))); // Serves static files (css, js, imgaes) from public directory

// Helps to stop mongo injection by not allowing certain characters in the query string
app.use((req, res, next) => {
  if (req.body)
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  if (req.params)
    req.params = mongoSanitize.sanitize(req.params, { replaceWith: "_" });
  next();
});

// Setting up helmet to allow certain scripts/stylesheets
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://code.jquery.com/",
  "https://www.google.com/recaptcha/api.js",
  "https://www.gstatic.com/recaptcha/releases/",
  "https://use.fontawesome.com/",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net/",
  "https://cdnjs.cloudflare.com/",
  "https://fonts.gstatic.com",
  "https://www.gstatic.com/recaptcha/releases/",
];
const imgSrcUrls = [
  "https://www.gstatic.com/recaptcha/",
  "https://www.google.com/recaptcha/",
];
const connectSrcUrls = [
  "https://www.google.com/",
  "https://www.gstatic.com/recaptcha/",
];
const fontSrcUrls = [
  "https://cdnjs.cloudflare.com/",
  "https://fonts.gstatic.com",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const frameSrcUrls = ["https://www.google.com", "https://www.recaptcha.net"];
// Function to configure helmet based on environment
function configureHelmet() {
  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'self'", "'unsafe-inline'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls],
            fontSrc: ["'self'", ...fontSrcUrls],
            frameSrc: ["'self'", ...frameSrcUrls],
            upgradeInsecureRequests: null, // Relax or adjust as necessary
            scriptSrcAttr: ["'self'", "'unsafe-inline'"], // Adjust based on your needs
          },
        },
        crossOriginOpenerPolicy: { policy: "same-origin" },
        originAgentCluster: true,
      }),
    );
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'", "*"],
            connectSrc: ["'self'", "*", ...connectSrcUrls],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              "*",
              ...scriptSrcUrls,
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "*", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'self'", "*"],
            imgSrc: ["'self'", "blob:", "data:", "*", ...imgSrcUrls],
            fontSrc: ["'self'", "*", ...fontSrcUrls],
            frameSrc: ["'self'", "*", ...frameSrcUrls],
            upgradeInsecureRequests: null,
            scriptSrcAttr: ["'self'", "'unsafe-inline'", "*"],
          },
        },
        crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Relaxed for development
        originAgentCluster: false, // Disabled in development
        referrerPolicy: { policy: "no-referrer-when-downgrade" }, // Less strict referrer policy
        frameguard: false, // Disable clickjacking protection in development
        hsts: false, // Disable HTTP Strict Transport Security (HSTS) in development
        noSniff: false, // Allow MIME type sniffing in development
      }),
    );
  }
}
// Apply helmet configuration
configureHelmet();

//setting up session
const sessionConfig = {
  name: "blog_longrunner", // Name for the session cookie
  secret: process.env.SESSION_KEY, // Secures the session
  resave: false, // Do not save session if unmodified
  saveUninitialized: false, // Do not create session until something stored
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 2, // 14 days
    httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS
    sameSite: "strict", // Protect against CSRF
  },
  store: MongoStore.create({
    mongoUrl: dbUrl,
  }),
};
app.use(session(sessionConfig));

// Required after session setup.
app.use(flash());
app.use(back());
app.use(populateUser); // Custom authentication middleware to populate user from session
app.use(getIpInfoMiddleware); // Setting up IP middleware
app.use(checkBlockedIP); // Blocked IP middleware - check before tracking
app.use(trackRequest); // Tracker middleware - place after IP middleware but before compression
app.use(compression()); // Compression to make website run quicker
app.use(generalLimiter); // Apply general rate limiting to all requests

// Middleware to set local variables and handle user session data
app.use(async (req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

////////////////////////////// Routes //////////////////////////////
// policy routes
app.get("/policy/cookie-policy", policy.cookiePolicy);
app.get("/policy/tandc", recaptcha.middleware.render, policy.tandc);
app.post(
  "/policy/tandc",
  recaptcha.middleware.verify,
  validateTandC,
  policy.tandcPost,
);

// auth routes
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
  authenticateUser,
  catchAsync(async (req, res) => {
    await loginUser(req, req.user);
    req.flash("success", "Welcome back!");
    const redirectUrl = req.session.returnTo || "/";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }),
);
app.get("/auth/logout", users.logout);
app.get("/auth/forgot", users.forgot);
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

// admin routes
app.get("/admin", isLoggedIn, isAdmin, catchAsync(admin.dashboard));
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
app.get("/admin/tracker", isLoggedIn, isAdmin, catchAsync(admin.tracker));
app.get(
  "/admin/blocked-ips",
  isLoggedIn,
  isAdmin,
  catchAsync(admin.blockedIPs),
);
app.post("/admin/block-ip", isLoggedIn, isAdmin, catchAsync(admin.blockIP));
app.post("/admin/unblock-ip", isLoggedIn, isAdmin, catchAsync(admin.unblockIP));

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

// blogIM routes (public only)
app.get("/", catchAsync(blogsIM.index));
app.get("/blogim/:id", catchAsync(blogsIM.show));

// Site-Map route
app.get("/sitemap.xml", (req, res) => {
  res.sendFile("/home/hutch/slapp/public/manifest/sitemap.xml");
});

// Unknown (404) webpage error
app.use((req, res) => {
  res.status(404).render("policy/error", {
    err: { message: "Page Not Found", statusCode: 404 },
    title: "Error - Page Not Found",
    css_page: "error",
  });
});

// Tracker middleware
app.use(trackRequest);

// Error Handler, from utils.
app.use(errorHandler);

// Start server on port 3004 using HTTP
const port = 3001;
app.listen(port, () => {
  console.log("Server listening on PORT", port);
});
