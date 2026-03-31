# ⚠️ Archived Project

### This repository has been archived and is no longer actively maintained.

- No new features or bug fixes will be added
- Issues and pull requests are no longer monitored
- If you’d like to continue development, feel free to fork the project.

Last maintained: 20260331

Superseded by: longrunner-platform (monrepo project)

---
---

# 🏃‍♂️ Ironman Training Blog

A full-featured blog application built for Ironman training content at blog.longrunner.co.uk. This Node.js/Express application features user authentication, content management, and an interactive review system with advanced security and moderation capabilities.

🔗 Live at: [https://blog.longrunner.co.uk](https://blog.longrunner.co.uk)
_Note: The website may be temporarily unavailable during updates or testing._

---

## ✨ Features

### Core Functionality

- ✅ **User Authentication** - Registration, login, logout, password reset, and account deletion
- 📝 **Blog Management** - Full CRUD operations for blog posts with rich content support
- 💬 **Review System** - User comments with spam filtering and moderation
- 👥 **Role-Based Access** - User and admin roles with appropriate permissions
- 🔒 **Advanced Security** - Rate limiting, IP blocking, content sanitization, and CSRF protection

### Admin Features

- 📊 **Admin Dashboard** - Comprehensive admin interface for content management
- 🚩 **Review Moderation** - Flagged review management with approval/rejection workflow
- 📝 **Content Management** - Create, edit, and delete blog posts
- 👤 **User Management** - Overview of user activity and account management
- 📈 **Analytics Dashboard** - Real-time visitor tracking and request analytics
- 🛡️ **IP Management** - Block/unblock suspicious IPs with caching system

### Security & Performance

- 🛡️ **Security Middleware** - Helmet, compression, and custom security layers
- 🚦 **Rate Limiting** - Multiple rate limiters for different endpoints
- 🌍 **IP Tracking** - Geolocation and malicious IP blocking with fallback services
- 📊 **Request Analytics** - Comprehensive tracking of visitors, routes, and countries
- 📧 **Email Notifications** - Automated email system for important events
- 🗂️ **Session Management** - Secure session storage with MongoDB
- ⚡ **Performance Optimization** - Caching strategies and database indexing

---

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** bcrypt + express-session
- **Validation:** Joi schemas
- **Security:** Helmet, express-rate-limit, custom middleware
- **Analytics:** Custom request tracking with geo-location
- **IP Management:** Advanced IP blocking with caching

### Frontend

- **Templating:** EJS with ejs-mate layouts
- **Styling:** Bootstrap 5
- **Client-side:** Vanilla JavaScript with form validation
- **UI Components:** Flash messages, responsive design, analytics dashboards

### Key Dependencies

- **Security:** helmet, bcrypt, sanitize-html, express-rate-limit
- **Email:** nodemailer (Zoho SMTP)
- **Geolocation:** geoip-lite, axios (fallback API)
- **Session:** connect-mongo for persistent sessions
- **Validation:** joi, express-recaptcha
- **Analytics:** Custom tracker with MongoDB aggregation
- **Development:** eslint, prettier

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB database
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd blog-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
node app.js
```

### Environment Variables

Required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `SECRET` - Session secret key
- `SITEKEY` - reCAPTCHA site key
- `SECRETKEY` - reCAPTCHA secret key
- Email configuration for nodemailer

---

## 📁 Project Structure

```
├── controllers/          # Route handlers
│   ├── admin.js          # Admin dashboard and content management
│   ├── blogsIM.js        # Blog post operations
│   ├── policy.js         # Legal policy pages
│   ├── reviews.js        # Review system and moderation
│   └── users.js          # User authentication and management
├── models/               # Database models and schemas
│   ├── blogIM.js         # Blog post model
│   ├── blockedIP.js      # IP blocking model
│   ├── review.js         # Review model
│   ├── schemas.js        # Joi validation schemas
│   ├── tracker.js        # Analytics tracking model
│   └── user.js           # User model with auth methods
├── utils/                # Utility functions and middleware
│   ├── auth.js           # Authentication utilities
│   ├── blockedIPMiddleware.js # IP blocking system with caching
│   ├── catchAsync.js     # Async error wrapper
│   ├── contentFilter.js  # Spam detection and content filtering
│   ├── errorHandler.js   # Centralized error handling
│   ├── ipLookup.js       # Geolocation with fallback services
│   ├── ipMiddleware.js   # IP tracking and processing
│   ├── mail.js           # Email service
│   ├── middleware.js     # Request validation and authorization
│   ├── passwordUtils.js  # Password security utilities
│   ├── rateLimiter.js    # Rate limiting configuration
│   └── tracker.js        # Request analytics middleware
├── views/                # EJS templates
│   ├── admin/            # Admin interface templates
│   │   ├── tracker.ejs       # Analytics dashboard
│   │   └── blockedIPs.ejs    # IP management interface
│   ├── blogim/           # Blog-related templates
│   ├── layouts/          # Base layouts
│   ├── partials/         # Reusable components
│   ├── policy/           # Legal policy templates
│   └── users/            # User authentication templates
├── public/               # Static assets
│   ├── javascripts/      # Client-side scripts
│   ├── stylesheets/      # CSS files
│   └── images/           # Static images
└── docs/                 # Project documentation
    ├── AGENTS.md          # Development commands and guidelines
    ├── ARCHITECTURE_REFERENCE.md  # Detailed architecture documentation
    └── DEVELOPMENT_LOG.md  # Development session history
```

---

## 🔧 Development

### Available Scripts

```bash
# Start the application
node app.js

# Lint code
npm run lint

# Lint and fix code
npm run lint:fix
```

### Code Style Guidelines

- **Pattern:** MVC architecture with clear separation of concerns
- **Modules:** CommonJS (`require`/`module.exports`)
- **Error Handling:** Async functions wrapped with `catchAsync`
- **Security:** All inputs validated and sanitized
- **Database:** Mongoose schemas with proper validation
- **Authentication:** bcrypt for password hashing, express-session for sessions

### Key Features Implementation

- **Security:** Custom middleware for MongoDB injection protection and IP blocking
- **Performance:** Compression middleware, caching strategies, and efficient database queries
- **User Experience:** Flash messages, responsive design, form validation
- **Admin:** Comprehensive moderation tools with review flagging system
- **Analytics:** Real-time visitor tracking, country statistics, and route analytics
- **IP Management:** Advanced blocking system with geolocation and fallback services

---

## 🤝 Contributing

This project follows established development patterns and security best practices. Contributions are welcome!

### Development Guidelines

- Follow the existing MVC structure and naming conventions
- Use the established error handling patterns with `catchAsync`
- Implement proper validation using Joi schemas
- Ensure all user inputs are sanitized
- Test thoroughly before submitting changes
- Follow the ESLint configuration (run `npm run lint`)

### Areas for Enhancement

- Additional content types beyond blog posts
- Enhanced user role system
- API endpoints for mobile applications
- Advanced analytics and reporting (currently in development)
- Email subscription system
- Social media integration
- Real-time notifications for admin events
- Automated threat detection and response

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

_Built with ❤️ for the Ironman training community_
