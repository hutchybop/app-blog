const Review = require('../models/review');
const { BlogIM } = require('../models/blogIM')
const BlockedIP = require('../models/blockedIP')
const { mail } = require('../utils/mail');
const { reviewIp } = require('../utils/ipLookup');
const ContentFilter = require('../utils/contentFilter');

module.exports.create = async (req, res, next) => {
    const blogIM = await BlogIM.findById(req.params.id)
    const review = new Review(req.body.review)
    const blocked = await BlockedIP.find()
    let {ip, countryName, cityName} = reviewIp(req)
    let emailUser
    let flashmsg

    // Enhanced content filtering and spam detection
    const contentValidation = ContentFilter.validateReview(review.body);
    
    if (contentValidation.isSpam) {
        const errorMessage = ContentFilter.getSpamErrorMessage(contentValidation);
        req.flash('error', errorMessage);

        // Log spam attempt for admin review
        mail(
            'Spam Review Blocked',
            'Hey,\n\n' +
                'A spam review was blocked with the following details:\n\n' +
                'Original Content: ' + contentValidation.originalContent + '\n\n' +
                'Spam Score: ' + contentValidation.score + '\n' +
                'Reasons: ' + contentValidation.reasons.join(', ') + '\n\n' +
                'By: ' + (req.user ? req.user.username : 'anonymous') + '\n\n' +
                'IP Address: ' + ip + '\n' +
                'Country: ' + countryName + '\n' + 
                'City: ' + cityName + '\n\n' +
                'Spam Details: ' + JSON.stringify(contentValidation.details, null, 2)
        );

        // Block IP if high spam score
        if (contentValidation.score >= 10) {
            if(blocked[0] !== undefined){
                if (!blocked[0].blockedIPArray.includes(ip)) {
                    blocked[0].blockedIPArray.push(ip);
                    blocked[0].markModified("blockedIPArray");
                    await blocked[0].save();
                }
            } else {
                new BlockedIP({blockedIPArray: [ip]}).save();
            }
        }
        
        return res.redirect(`/blogim/${blogIM._id}`);
    }

    // Use sanitized content
    review.body = contentValidation.sanitizedContent;
    
    // Store metadata for moderation
    review.spamScore = contentValidation.score;
    review.ipAddress = ip;
    review.userAgent = req.get('User-Agent') || 'Unknown';
    
    // Flag for admin review if moderate spam score
    if (contentValidation.score >= 3 && contentValidation.score < 5) {
        review.isFlagged = true;
        review.flagReason = 'Moderate spam score: ' + contentValidation.reasons.join(', ');
    }

    if(!req.user){
      review.author = "618ae270defe900f7f2980d5"
      emailUser = 'anonymous'
      flashmsg = 'Review created, register to show your user name!'
    }else{
      review.author = req.user._id
      emailUser  = req.user.username
      flashmsg = 'Succesfully created a new review!'
    }
    

    blogIM.reviews.push(review)
    await review.save()
    await blogIM.save()


    req.flash('success', flashmsg )

    mail(
      'New review on hutchybop.co.uk',
      'Hello,\n\n' +
          'A new review has been left on ' + '"' + blogIM.title + '"' + '\n\n' +
          'Reading: ' + review.body + '\n\n' + 
          'By: ' + emailUser + '\n\n\n' +
          'IP Address: ' + ip + '\n' +
          'Country: ' + countryName + '\n' + 
          'City: ' + cityName
    )

    res.redirect(`/blogim/${blogIM._id}`)
}


module.exports.delete = async (req, res) => {
    const { id, reviewId } = req.params;
    const blogIM = await BlogIM.findById(id)
    const review = await Review.findById(reviewId)
    await Review.findByIdAndDelete(req.params.reviewId);
    await BlogIM.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    req.flash('success', 'Succesfully deleted review!')

    let {ip, countryName, cityName} = reviewIp(req)

    mail(
      'Review deleted on hutchybop.co.uk',
      'Hello,\n\n' +
          'A review has been deleted on ' + '"' + blogIM.title + '"' + '\n\n' +
          'Reading: ' + review.body + '\n\nBy: ' + req.user.username + '\n\n\n' +
          'IP Adress: ' + ip + '\n' +
          'Counrty: ' + countryName + '\n' + 
          'City: ' + cityName
    )

    res.redirect(`/blogim/${id}`)
}


module.exports.reviewLogin = (req, res) => {
    res.redirect(`/blogim/${req.params.id}`)
}

// Admin route to view flagged reviews
module.exports.flaggedReviews = async (req, res) => {
    const flaggedReviews = await Review.find({ isFlagged: true })
        .populate('author', 'username email')
        .sort({ createdAt: -1 });
    
    res.render('admin/flaggedReviews', { 
        flaggedReviews, 
        title: 'Flagged Reviews - Admin',
        page: 'Admin'
    });
}

// Admin route to approve/remove flagged review
module.exports.updateFlaggedReview = async (req, res) => {
    const { reviewId, action } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review) {
        req.flash('error', 'Review not found');
        return res.redirect('/admin/flagged-reviews');
    }
    
    if (action === 'approve') {
        review.isFlagged = false;
        review.flagReason = undefined;
        await review.save();
        req.flash('success', 'Review approved and flag removed');
    } else if (action === 'delete') {
        await Review.findByIdAndDelete(reviewId);
        await BlogIM.updateMany(
            { reviews: reviewId },
            { $pull: { reviews: reviewId } }
        );
        req.flash('success', 'Review deleted');
    }
    
    res.redirect('/admin/flagged-reviews');
}