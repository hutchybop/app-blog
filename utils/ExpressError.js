class ExpressError extends Error {
  constructor(message, statusCode) {
    super(message); // ← THIS generates the stack
    this.statusCode = statusCode;

    // Optional but recommended for custom errors:
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ExpressError;
