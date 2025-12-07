const mongoose = require("mongoose");
const BlogIM = require("./models/blogIM");
require("dotenv").config();

async function fixBlogPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database\n");

    const posts = await BlogIM.find({});
    console.log(`Found ${posts.length} blog posts to fix:\n`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      let updatedContent = post.post;
      let hasChanges = false;

      console.log(`\n=== POST ${i + 1}: "${post.title}" ===`);
      console.log(`ID: ${post._id}`);

      // Fix spelling errors
      const fixes = [
        {
          pattern: /\bfist\b/g,
          replacement: "first",
          description: "fist → first",
        },
        {
          pattern: /\bdrying\b/g,
          replacement: "dying",
          description: "dying (context: people dying)",
        },
        {
          pattern: /\bsay\b/g,
          replacement: "stay",
          description: "say → stay (context: stay at home)",
        },
        {
          pattern: /\bfigures\b/g,
          replacement: "fingers",
          description: "figures → fingers (context: fingers numb)",
        },
        {
          pattern: /\bheavies\b/g,
          replacement: "heaviest",
          description: "heavies → heaviest",
        },
        {
          pattern: /\bYoutbue\b/g,
          replacement: "YouTube",
          description: "Youtbue → YouTube",
        },
        {
          pattern: /\bchippy's\b/g,
          replacement: "chippy's",
          description: "chippy's (apostrophe placement)",
        },
      ];

      fixes.forEach((fix) => {
        const matches = updatedContent.match(fix.pattern);
        if (matches) {
          console.log(
            `  ✓ Fixing: ${fix.description} (${matches.length} instances)`,
          );
          updatedContent = updatedContent.replace(fix.pattern, fix.replacement);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        // Update the post in database
        await BlogIM.findByIdAndUpdate(post._id, { post: updatedContent });
        console.log(`  ✅ Updated post "${post.title}"`);
      } else {
        console.log(`  ℹ️  No changes needed for this post`);
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ All fixes completed. Database disconnected.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixBlogPosts();
