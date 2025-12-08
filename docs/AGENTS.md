# AGENTS.md

## Commands

- Start server: `node app.js` (runs on port 3004)
- Lint: `npm run lint` (ESLint with Prettier)
- Lint and fix: `npm run lint:fix`
- No automated tests configured - manual testing required

## Code Style Guidelines

### Imports & Structure

- Use CommonJS: `const express = require('express')`
- Follow MVC pattern: controllers/, models/, views/, utils/
- Export individual functions: `module.exports.functionName = async (req, res) => {}`
- ESLint config: ES2021, CommonJS for Node.js, ES modules for public assets
- Import order: Node.js built-ins → third-party → local modules

### Error Handling

- Wrap async routes with `catchAsync` wrapper from utils/catchAsync.js
- Use custom `ExpressError` class for custom errors
- Always handle async operations with try/catch or catchAsync
- Use flash messages for user feedback: `req.flash('success', 'message')`

### Database & Security

- Use Mongoose schemas with proper validation
- Sanitize inputs with Joi validation and sanitize-html
- Use security middleware: helmet, compression, rate limiting
- Custom mongo injection protection middleware in app.js
- Use `populate()` for referenced documents when needed

### Naming Conventions

- Variables: camelCase
- Models/Schemas: PascalCase
- Routes: RESTful patterns with method-override
- Files: lowercase with descriptive names
- Functions: descriptive verbs (getUserById, createPost)

### Code Patterns

- Use async/await consistently, avoid callbacks
- Destructure req.params, req.body: `const { id } = req.params`
- Use template literals for strings with variables
- Follow Express.js middleware patterns
- Use EJS templating with ejs-mate for layouts
- Handle undefined variables safely: `typeof posts !== 'undefined' ? posts.length : 0`
