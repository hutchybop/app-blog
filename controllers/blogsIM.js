const BlogIM = require("../models/blogIM");

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
