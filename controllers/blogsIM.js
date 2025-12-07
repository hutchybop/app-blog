const { BlogIM } = require("../models/blogIM");

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

// NEW - BlogIM (get)
module.exports.new = async (req, res) => {
  // Creates an array of num from the IM posts and chooses the biggest number
  const posts = await BlogIM.find();
  let nums = [];
  for (let post of posts) {
    nums.push(post.num);
  }
  let num = Math.max.apply(Math, nums);

  res.render("blogim/new", { page: "Blog", title: "Create BlogIM", num });
};

// CREATE - BlogIM (post)
module.exports.create = async (req, res) => {
  const newPost = await BlogIM.create(req.body);
  res.redirect(`/blogim/${newPost._id}`);
};

// SHOW - BlogIM (get)
module.exports.show = async (req, res) => {
  const post = await BlogIM.findById(req.params.id).populate({
    path: "reviews",
    populate: {
      path: "author",
    },
  });
  res.render("blogim/show", { page: "Blog", title: post.title, post });
};

// EDIT - BlogIM (get)
module.exports.edit = async (req, res) => {
  const { id } = req.params;
  const post = await BlogIM.findById(id);
  res.render("blogim/edit", { page: "Blog", post });
};

// UPDATE - BlogIM (put)
module.exports.update = async (req, res) => {
  const { id } = req.params;
  const updatedPost = await BlogIM.findByIdAndUpdate(id, req.body);
  res.redirect(`/blogim/${updatedPost.id}`);
};

// DELETE - BlogIM (delete)
module.exports.delete = async (req, res) => {
  const { id } = req.params;
  await BlogIM.findByIdAndRemove(id);
  res.redirect("/blogim");
};
