const BlogIM = require("../models/blogIM");
const Review = require("../models/review");
const { mail } = require("../utils/mail");

// ADMIN DASHBOARD - Admin dashboard (get)
module.exports.dashboard = async (req, res) => {
  const posts = await BlogIM.find().sort({ createdAt: -1 });
  const flaggedReviews = await Review.find({ isFlagged: true });
  const allReviews = await Review.find({});
  const recentPosts = posts.slice(0, 5);

  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    posts,
    recentPosts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
  });
};

// ADMIN INDEX - BlogIM for admin management (get)
module.exports.posts = async (req, res) => {
  let posts = await BlogIM.find().sort({ createdAt: -1 });
  const sortOrder = req.query.sort || "newest";
  const flaggedReviews = await Review.find({ isFlagged: true });
  const allReviews = await Review.find({});

  if (sortOrder === "oldest") {
    posts.sort((a, b) => a.num.toString().localeCompare(b.num.toString()));
  } else if (sortOrder === "newest") {
    posts.sort((a, b) => b.num.toString().localeCompare(a.num.toString()));
  } else {
    posts.sort((a, b) => a.num.toString().localeCompare(b.num.toString()));
  }

  res.render("admin/posts", {
    title: "Admin - Post Management",
    posts,
    sortOrder,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
  });
};

// ADMIN NEW - BlogIM (get)
module.exports.newPost = async (req, res) => {
  // Creates an array of num from the IM posts and chooses the biggest number
  const posts = await BlogIM.find();
  let nums = [];
  for (let post of posts) {
    nums.push(post.num);
  }
  let num = Math.max.apply(Math, nums);

  // Get review counts for admin pages
  const flaggedReviews = await Review.find({ isFlagged: true });
  const allReviews = await Review.find({});

  res.render("admin/new", {
    title: "Admin - Create Post",
    num,
    posts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
  });
};

// ADMIN CREATE - BlogIM (post)
module.exports.createPost = async (req, res) => {
  await BlogIM.create(req.body);
  req.flash("success", "Post created successfully!");
  res.redirect("/admin/posts");
};

// ADMIN EDIT - BlogIM (get)
module.exports.editPost = async (req, res) => {
  const { id } = req.params;
  const post = await BlogIM.findById(id);

  // Get review counts for admin pages
  const flaggedReviews = await Review.find({ isFlagged: true });
  const allReviews = await Review.find({});
  const posts = await BlogIM.find();

  res.render("admin/edit", {
    title: "Admin - Edit Post",
    post,
    posts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
    formAction: `/admin/posts/${id}?_method=PUT`,
  });
};

// ADMIN UPDATE - BlogIM (put)
module.exports.updatePost = async (req, res) => {
  const { id } = req.params;
  await BlogIM.findByIdAndUpdate(id, req.body);
  req.flash("success", "Post updated successfully!");
  res.redirect("/admin/posts");
};

// ADMIN DELETE - BlogIM (delete)
module.exports.deletePost = async (req, res) => {
  const { id } = req.params;
  await BlogIM.findByIdAndRemove(id);
  req.flash("success", "Post deleted successfully!");
  res.redirect("/admin/posts");
};

// ADMIN FLAGGED REVIEWS - View flagged reviews (get)
module.exports.flaggedReviews = async (req, res) => {
  const flaggedReviews = await Review.find({ isFlagged: true })
    .populate("author", "username email")
    .sort({ createdAt: -1 });

  const allReviews = await Review.find({});
  const posts = await BlogIM.find();

  res.render("admin/flaggedReviews", {
    flaggedReviews,
    posts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
    title: "Flagged Reviews - Admin",
  });
};

// ADMIN UPDATE FLAGGED REVIEW - Approve/remove flagged review (put)
module.exports.updateFlaggedReview = async (req, res) => {
  const { reviewId, action } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect("/admin/flagged-reviews");
  }

  if (action === "approve") {
    review.isFlagged = false;
    review.flagReason = undefined;
    await review.save();

    // Add the approved review to the blog post
    await BlogIM.findByIdAndUpdate(review.blogIM, {
      $push: { reviews: review._id },
    });

    req.flash("success", "Review approved and added to post");
  } else if (action === "delete") {
    await Review.findByIdAndDelete(reviewId);
    await BlogIM.updateMany(
      { reviews: reviewId },
      { $pull: { reviews: reviewId } },
    );
    req.flash("success", "Review deleted");
  }

  res.redirect("/admin/flagged-reviews");
};

// ADMIN ALL REVIEWS - View all reviews with management options (get)
module.exports.allReviews = async (req, res) => {
  const allReviews = await Review.find({})
    .populate("author", "username email")
    .populate("blogIM", "title")
    .sort({ createdAt: -1 });

  const flaggedReviews = await Review.find({ isFlagged: true });
  const posts = await BlogIM.find();

  res.render("admin/allReviews", {
    allReviews,
    posts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
    title: "All Reviews - Admin",
  });
};

// ADMIN DELETE REVIEW WITH REASON - Delete any review with reason (delete)
module.exports.deleteReviewWithReason = async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;

  const review = await Review.findById(reviewId)
    .populate("author", "username email")
    .populate("blogIM", "title");

  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect("/admin/all-reviews");
  }

  // Send email to user if not anonymous
  if (
    review.author &&
    review.author._id.toString() !== "618ae270defe900f7f2980d5"
  ) {
    const postTitle = review.blogIM ? review.blogIM.title : "Unknown Post";
    const emailSubject = "Your review has been removed";
    const emailText =
      `Hello ${review.author.username},\n\n` +
      `Your review on the post "${postTitle}" has been removed by an administrator.\n\n` +
      `Review content: "${review.body}"\n\n` +
      `Reason for removal: ${reason || "No specific reason provided"}\n\n` +
      `If you have any questions, please contact us.\n\n` +
      `Thank you,\n` +
      `The Admin Team`;

    await mail(emailSubject, emailText, review.author.email);
  }

  // Delete the review and remove from blog post
  await Review.findByIdAndDelete(reviewId);
  await BlogIM.updateMany(
    { reviews: reviewId },
    { $pull: { reviews: reviewId } },
  );

  req.flash("success", "Review deleted successfully");
  res.redirect("/admin/all-reviews");
};
