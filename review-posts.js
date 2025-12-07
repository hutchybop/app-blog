const mongoose = require("mongoose");
const BlogIM = require("./models/blogIM");
require("dotenv").config();

async function reviewBlogPosts() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Get all blog posts
    const posts = await BlogIM.find({});
    console.log(`\nFound ${posts.length} blog posts:\n`);

    // Display each post for review
    posts.forEach((post, index) => {
      console.log(`\n=== POST ${index + 1} ===`);
      console.log(`ID: ${post._id}`);
      console.log(`Title: ${post.title}`);
      console.log(`Number: ${post.num}`);
      console.log(`Image: ${post.img || "No image"}`);
      console.log(`Created: ${post.createdAt}`);
      console.log(`\nContent:\n${post.post}`);
      console.log("\n" + "=".repeat(50));
    });

    await mongoose.disconnect();
    console.log("\nDatabase disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

reviewBlogPosts();
