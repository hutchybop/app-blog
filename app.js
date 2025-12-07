if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// required packages
const express = require('express');
const path = require('path');
const { mongoose } = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const flash = require('connect-flash');
const back = require('express-back');

const helmet = require('helmet');
const { getIpInfoMiddleware } = require('./utils/ipMiddleware');
const compression = require('compression')
const { generalLimiter, authLimiter, passwordResetLimiter, registrationLimiter, reviewLimiter } = require('./utils/rateLimiter');

// database lookup for blockedIPs
const BlockedIP = require('./models/blockedIP')
const { reviewIp } = require('./utils/ipLookup');
const tnc = require('./tnc')

// requires modules.exports
const users = require('./controllers/users');
const reviews = require('./controllers/reviews');
const blogsIM = require('./controllers/blogsIM')
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const {
    validateLogin, validateRegister, validateForgot, validateReset, validateDetails, validateDelete, validateReview,
    isReviewAuthor, isLoggedIn, isAdmin, populateUser
} = require('./utils/middleware');
const { errorHandler } = require('./utils/errorHandler');
const User = require('./models/user');


// setting up express
const app = express();

// setting up mongoose
const dbUrl = process.env.MONGODB_URI

mongoose.connect(dbUrl);

// Error Handling for the db connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
// Allows us to add HTTP verbs other than post
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '/public')))
// Helps to stop mongo injection by not allowing certain characters in the query string
// Custom mongo sanitize middleware for Express 5 compatibility
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = obj[key].replace(/\$/g, '');
        } else if (typeof obj[key] === 'object') {
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
app.use(helmet())

// Setting up helmet to allow certain scripts/stylesheets
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.jsdelivr.net/",
    "https://code.jquery.com/",
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
    "https://fonts.gstatic.com"
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
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                ...imgSrcUrls
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


//setting up session
const sessionConfig = {
    name: 'hutchyBop',
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS
        sameSite: "strict" // Protect against CSRF
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || dbUrl
    })
}
app.use(session(sessionConfig))

// Required after session setup.
app.use(flash());
app.use(back());

// Custom authentication middleware to populate user from session
app.use(populateUser);

// Setting up IP middleware
app.use(getIpInfoMiddleware);

// Compression to make website run quicker
app.use(compression())

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Middleware to set local variables and handle user session data
app.use(async(req, res, next) => {
    // console.log(`${req.method} ${req.url} - middleware hit`); // Commented out to reduce console noise
    res.locals.currentUser = req.user;
    // Setting up flash
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');

    // // Setting up tracker log
    // myLogger(req, res, next)
    // if(String(req.secure) == process.env.REQ_SECURE){
    //     return res.redirect('https://' + req.headers.host + req.url)
    // }

    next();
});


// info route
app.get('/info', (req, res) => {
    res.render('info', { title: 'hutchybop.co.uk Information Page', page: 'Info', tnc: tnc.tnc });
});

// user routes
app.get('/register', (users.register))
app.post('/register', registrationLimiter, validateRegister, catchAsync(users.registerPost))
app.get('/login', users.login)
app.post('/login', authLimiter, validateLogin, require('./utils/auth').authenticateUser, catchAsync(async (req, res) => {
    await require('./utils/auth').loginUser(req, req.user);
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/blogim';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}))
app.get('/logout', users.logout)
app.get('/forgot', (req, res, next) => {
  return users.forgot(req, res, next);
})
app.post('/forgot', passwordResetLimiter, validateForgot, catchAsync(users.forgotPost))
app.get('/reset/:token', users.reset)
app.post('/reset/:token', validateReset, catchAsync(users.resetPost))
app.get('/details', isLoggedIn, users.details)
app.post('/details', validateDetails, catchAsync(users.detailsPost))
app.get('/deletepre', isLoggedIn, users.deletePre)
app.delete('/delete', isLoggedIn, validateDelete, users.delete)

// review routes
app.post('/blogim/:id/reviews', reviewLimiter, validateReview, catchAsync(reviews.create))
app.delete('/blogim/:id/reviews/:reviewId', isReviewAuthor, isLoggedIn, catchAsync(reviews.delete))
app.get('/blogim/:id/reviews', reviews.reviewLogin)

// Admin routes for content moderation
app.get('/admin/flagged-reviews', isLoggedIn, isAdmin, catchAsync(reviews.flaggedReviews))
app.post('/admin/flagged-reviews/:reviewId/:action', isLoggedIn, isAdmin, catchAsync(reviews.updateFlaggedReview))

// home route - redirect to blog
app.get('/', (req, res) => {
    res.redirect('/blogim');
})

// blogIM routes
app.get('/blogim', catchAsync(blogsIM.index))
app.get('/blogim/pBsy6S3RgVhPg48HWZH7keaTI3EcwknE', isLoggedIn, isAdmin, catchAsync(blogsIM.new))
app.post('/blogim', isLoggedIn, isAdmin, catchAsync(blogsIM.create))
app.get('/blogim/:id', catchAsync(blogsIM.show))
app.get('/blogim/:id/edit', isLoggedIn, isAdmin, catchAsync(blogsIM.edit))
app.put('/blogim/:id', isLoggedIn, isAdmin, catchAsync(blogsIM.update))
app.delete('/blogim/:id', isLoggedIn, isAdmin, catchAsync(blogsIM.delete))



// Site-Map route
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Unknown (404) webpage error
app.use((req, res) => {
    res.status(404).render("error", {
        err: { message: "Page Not Found", statusCode: 404 },
        title: "Error - Page Not Found",
        page: "error",
    });
});


// Error Handler, from utils.
// app.use(errorHandler)


// Start server on port 3004 using HTTP
app.listen(3004, () => {
  console.log("Server listening on PORT 3004");
});
