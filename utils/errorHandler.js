//Error handler
module.exports.errorHandler = (err, req, res) => {
    const { statusCode = 500 } = err;

    // Cast error
    if (err.name === 'CastError') {
        // console.log(err)
        req.flash('error', `${err.name} The information provided cannot be found!`);
        return res.back();
    }

    // Email error
    if (err.message === '"email" must be a valid email') {
        req.flash('error', 'You need to enter a valid email address.')
        return res.redirect(req.originalUrl);
    }

    // Generic error
    if (!err.message) err.message = 'Oh No, something went wrong.'
    res.status(statusCode).render('error', { err, title: 'Error - Something Went Wrong', page: 'Error' })
};