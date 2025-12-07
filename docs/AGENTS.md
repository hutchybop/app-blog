# AGENTS.md

## Commands
- Start server: `node app.js` (runs on ports 80/443)
- No automated tests configured - manual testing via newServerScripts/testL.sh
- No linting/formatting tools configured

## Code Style Guidelines

### Imports & Structure
- Use CommonJS: `const express = require('express')`
- Follow MVC pattern: controllers/, models/, views/, utils/
- Export individual functions: `module.exports.functionName = async (req, res) => {}`

### Error Handling
- Wrap async routes with `catchAsync` wrapper
- Use custom `ExpressError` class for custom errors
- Always handle async operations with try/catch or catchAsync

### Database & Security
- Use Mongoose schemas with proper validation
- Sanitize inputs with Joi validation and sanitize-html
- Use security middleware: helmet, mongo-sanitize
- Follow Passport.js authentication patterns

### Naming Conventions
- Variables: camelCase
- Models/Schemas: PascalCase
- Routes: RESTful patterns with method-override
- Files: lowercase with descriptive names

### Code Patterns
- Use async/await consistently
- Populate Mongoose queries when needed
- Use flash messages for user feedback
- Follow Express.js middleware patterns