const Review = require("../models/review");
const BlogIM = require("../models/blogIM");
const BlockedIP = require("../models/blockedIP");
const { mail } = require("../utils/mail");
const { reviewIp } = require("../utils/ipLookup");
const ContentFilter = require("../utils/contentFilter");

module.exports.create = async (req, res) => {
  const blogIM = await BlogIM.findById(req.params.id);
  const review = new Review(req.body.review);
  review.blogIM = blogIM._id;
  const blocked = await BlockedIP.find();
  let { ip, countryName, cityName } = reviewIp(req);
  let flashmsg;

  // Enhanced content filtering and spam detection
  const contentValidation = ContentFilter.validateReview(review.body);

  if (contentValidation.isSpam) {
    flashmsg = "Review flagged for possible spam and sent for admin review";

    // Set author for spam reviews
    if (!req.user) {
      review.author = "618ae270defe900f7f2980d5";
    } else {
      review.author = req.user._id;
    }

    // Always flag spam for admin review instead of blocking
    review.isFlagged = true;
    review.flagReason =
      contentValidation.score >= 10
        ? "High spam score: " + contentValidation.reasons.join(", ")
        : "Spam detected: " + contentValidation.reasons.join(", ");

    // Block IP if high spam score
    if (contentValidation.score >= 10) {
      if (blocked[0] !== undefined) {
        if (!blocked[0].blockedIPArray.includes(ip)) {
          blocked[0].blockedIPArray.push(ip);
          blocked[0].markModified("blockedIPArray");
          await blocked[0].save();
        }
      } else {
        new BlockedIP({ blockedIPArray: [ip] }).save();
      }
    }

    // Save flagged review for admin review (don't add to post yet)
    await review.save();

    // Log spam attempt for admin review
    mail(
      "Spam Review Flagged for Admin Review",
      "Hey,\n\n" +
        "A spam review has been flagged with the following details:\n\n" +
        "Original Content: " +
        contentValidation.originalContent +
        "\n\n" +
        "Spam Score: " +
        contentValidation.score +
        "\n" +
        "Reasons: " +
        contentValidation.reasons.join(", ") +
        "\n\n" +
        "By: " +
        (req.user ? req.user.username : "anonymous") +
        "\n\n" +
        "IP Address: " +
        ip +
        "\n" +
        "Country: " +
        countryName +
        "\n" +
        "City: " +
        cityName +
        "\n\n" +
        "Spam Details: " +
        JSON.stringify(contentValidation.details, null, 2),
    );

    req.flash("success", flashmsg);
    return res.redirect(`/blogim/${blogIM._id}`);
  }

  // Use sanitized content
  review.body = contentValidation.sanitizedContent;

  // Store metadata for moderation
  review.spamScore = contentValidation.score;
  review.ipAddress = ip;
  review.userAgent = req.get("User-Agent") || "Unknown";

  // Flag for admin review if moderate spam score
  if (contentValidation.score >= 3 && contentValidation.score < 5) {
    review.isFlagged = true;
    review.flagReason =
      "Moderate spam score: " + contentValidation.reasons.join(", ");
  }

  if (!req.user) {
    review.author = "618ae270defe900f7f2980d5";
    flashmsg = "Review submitted successfully!";
  } else {
    review.author = req.user._id;
    flashmsg = "Review submitted successfully!";
  }

  // Save review first
  await review.save();

  // Only add to post if NOT flagged for admin review
  if (!review.isFlagged) {
    blogIM.reviews.push(review);
    await blogIM.save();
  }

  // Log spam attempt for admin review
  if (review.isFlagged) {
    mail(
      "Spam Review Flagged for Admin Review",
      "Hey,\n\n" +
        "A spam review has been flagged with the following details:\n\n" +
        "Original Content: " +
        contentValidation.originalContent +
        "\n\n" +
        "Spam Score: " +
        contentValidation.score +
        "\n" +
        "Reasons: " +
        contentValidation.reasons.join(", ") +
        "\n\n" +
        "By: " +
        (req.user ? req.user.username : "anonymous") +
        "\n\n" +
        "IP Address: " +
        ip +
        "\n" +
        "Country: " +
        countryName +
        "\n" +
        "City: " +
        cityName +
        "\n\n" +
        "Spam Details: " +
        JSON.stringify(contentValidation.details, null, 2),
    );
  }

  req.flash("success", flashmsg);
  return res.redirect(`/blogim/${blogIM._id}`);
};

module.exports.delete = async (req, res) => {
  const { id, reviewId } = req.params;
  const blogIM = await BlogIM.findById(id);
  const review = await Review.findById(reviewId);
  let { ip, countryName, cityName } = reviewIp(req);

  await Review.findByIdAndDelete(req.params.reviewId);
  await BlogIM.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  req.flash("success", "Successfully deleted review!");

  mail(
    "Review deleted on hutchybop.co.uk",
    "Hello,\n\n" +
      "A review has been deleted on " +
      '"' +
      blogIM.title +
      '"' +
      "\n\n" +
      "Reading: " +
      review.body +
      "\n\nBy: " +
      req.user.username +
      "\n\n" +
      "IP Address: " +
      ip +
      "\n" +
      "Country: " +
      countryName +
      "\n" +
      "City: " +
      cityName,
  );

  res.redirect(`/blogim/${id}`);
};

module.exports.reviewLogin = (req, res) => {
  res.redirect(`/blogim/${req.params.id}`);
};
