const BlogIM = require("../models/blogIM");
const Review = require("../models/review");

// INDEX - BlogIm (get)
module.exports.index = async (req, res) => {
  let posts = await BlogIM.find();
  const sortOrder = req.query.sort || "oldest";

  if (sortOrder === "newest") {
    posts.sort((a, b) => b.num.toString().localeCompare(a.num.toString()));
  } else {
    posts.sort((a, b) => a.num.toString().localeCompare(b.num.toString()));
  }

  res.render("blogim/index", {
    page: "Home",
    title: "My Ironman Blog",
    posts,
    sortOrder,
  });
};

// ADMIN INDEX - BlogIM for admin management (get)
module.exports.adminIndex = async (req, res) => {
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
    page: "Admin",
    title: "Admin - Post Management",
    posts,
    sortOrder,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
  });
};

// NEW - BlogIM (get)
module.exports.new = async (req, res) => {
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

  // Check if this is an admin route
  const isAdminRoute = req.originalUrl.includes("/admin/");

  if (isAdminRoute) {
    res.render("admin/new", {
      page: "Admin",
      title: "Admin - Create Post",
      num,
      posts,
      flaggedReviewsCount: flaggedReviews.length,
      allReviewsCount: allReviews.length,
    });
  } else {
    res.render("blogim/new", { page: "Blog", title: "Create BlogIM", num });
  }
};

// CREATE - BlogIM (post)
module.exports.create = async (req, res) => {
  const newPost = await BlogIM.create(req.body);

  // Check if this is an admin route
  const isAdminRoute = req.originalUrl.includes("/admin/");

  if (isAdminRoute) {
    req.flash("success", "Post created successfully!");
    res.redirect("/admin/posts");
  } else {
    res.redirect(`/blogim/${newPost._id}`);
  }
};

// SHOW - BlogIM (get)
module.exports.show = async (req, res) => {
  const post = await BlogIM.findById(req.params.id).populate({
    path: "reviews",
    populate: {
      path: "author",
      select: "username email",
    },
  });
  res.render("blogim/show", { page: "Blog", title: post.title, post });
};

// EDIT - BlogIM (get)
module.exports.edit = async (req, res) => {
  const { id } = req.params;
  const post = await BlogIM.findById(id);

  // Get review counts for admin pages
  const flaggedReviews = await Review.find({ isFlagged: true });
  const allReviews = await Review.find({});
  const posts = await BlogIM.find();

  res.render("admin/edit", {
    page: "Admin",
    title: "Admin - Edit Post",
    post,
    posts,
    flaggedReviewsCount: flaggedReviews.length,
    allReviewsCount: allReviews.length,
    formAction: `/admin/posts/${id}?_method=PUT`,
  });
};

// UPDATE - BlogIM (put)
module.exports.update = async (req, res) => {
  const { id } = req.params;
  const updatedPost = await BlogIM.findByIdAndUpdate(id, req.body);

  // Check if this is an admin route
  const isAdminRoute = req.originalUrl.includes("/admin/");

  if (isAdminRoute) {
    req.flash("success", "Post updated successfully!");
    res.redirect("/admin/posts");
  } else {
    res.redirect(`/blogim/${updatedPost.id}`);
  }
};

// DELETE - BlogIM (delete)
module.exports.delete = async (req, res) => {
  const { id } = req.params;
  await BlogIM.findByIdAndRemove(id);

  // Check if this is an admin route
  const isAdminRoute = req.originalUrl.includes("/admin/");

  if (isAdminRoute) {
    req.flash("success", "Post deleted successfully!");
    res.redirect("/admin/posts");
  } else {
    res.redirect("/blogim");
  }
};
