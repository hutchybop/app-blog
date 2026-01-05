module.exports = function flashMiddleware() {
  return function (req, res, next) {
    if (!req.session) {
      return next(new Error("Session middleware missing"));
    }

    // Expose flash to views
    res.locals.flash = req.session.flash || {};

    // Clear after read
    delete req.session.flash;

    // Attach helper
    req.flash = (type, message) => {
      req.session.flash ??= {};
      req.session.flash[type] ??= [];
      req.session.flash[type].push(message);
    };

    next();
  };
};
