const mongoose = require("mongoose");
const BlogIM = require("./models/blogIM");
require("dotenv").config();

function analyzeText(text) {
  const issues = [];

  // Remove HTML tags for text analysis
  const cleanText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Common spelling and grammar issues to check
  const commonIssues = [
    { pattern: /\bfist\b/gi, replacement: "first", type: "spelling" },
    { pattern: /\bthats\b/gi, replacement: "that's", type: "grammar" },
    {
      pattern: /\bits\b/gi,
      replacement: "it's",
      context: /\bits\b\s+(is|was)/gi,
      type: "grammar",
    },
    {
      pattern: /\byour\b/gi,
      replacement: "you're",
      context: /\byour\b\s+(going|coming|doing)/gi,
      type: "grammar",
    },
    {
      pattern: /\bthere\b/gi,
      replacement: "their",
      context: /\bthere\b\s+(house|car|training)/gi,
      type: "grammar",
    },
    {
      pattern: /\bto\b/gi,
      replacement: "too",
      context: /\bto\b\s+(much|many|big|small)/gi,
      type: "grammar",
    },
    {
      pattern: /\bdrying\b/gi,
      replacement: "dying",
      context: /\bdying\b/gi,
      type: "spelling",
    },
    {
      pattern: /\bsay\b/gi,
      replacement: "stay",
      context: /\bstay\b\s+at\s+home/gi,
      type: "spelling",
    },
    {
      pattern: /\bfigures\b/gi,
      replacement: "fingers",
      context: /\bfingers\b/gi,
      type: "spelling",
    },
    { pattern: /\bheavies\b/gi, replacement: "heaviest", type: "spelling" },
    { pattern: /\bYoutbue\b/gi, replacement: "YouTube", type: "spelling" },
    { pattern: /\bbutty\b/gi, replacement: "butty", type: "regional" }, // This is actually correct in some dialects
    { pattern: /\bfaffing\b/gi, replacement: "faffing", type: "regional" }, // This is actually correct
    { pattern: /\bchippy's\b/gi, replacement: "chippy's", type: "punctuation" },
    { pattern: /\.\s*([a-z])/g, replacement: ". $1", type: "capitalization" },
    { pattern: /\bI\b/g, replacement: "I", type: "capitalization" },
    { pattern: /\bi\b/g, replacement: "I", type: "capitalization" },
  ];

  commonIssues.forEach((issue) => {
    if (issue.context) {
      const matches = cleanText.match(issue.context);
      if (matches) {
        matches.forEach((match) => {
          issues.push({
            type: issue.type,
            found: match,
            suggestion: match.replace(issue.pattern, issue.replacement),
            context: getContext(cleanText, match),
          });
        });
      }
    } else {
      const matches = cleanText.match(issue.pattern);
      if (matches) {
        matches.forEach((match) => {
          issues.push({
            type: issue.type,
            found: match,
            suggestion: match.replace(issue.pattern, issue.replacement),
            context: getContext(cleanText, match),
          });
        });
      }
    }
  });

  return issues;
}

function getContext(text, searchTerm, contextLength = 50) {
  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);

  return text.substring(start, end);
}

async function reviewBlogPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database\n");

    const posts = await BlogIM.find({});
    console.log(`Found ${posts.length} blog posts to review:\n`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n=== POST ${i + 1}: "${post.title}" ===`);
      console.log(`ID: ${post._id}`);
      console.log(`Number: ${post.num}\n`);

      const issues = analyzeText(post.post);

      if (issues.length === 0) {
        console.log("✅ No obvious issues found");
      } else {
        console.log(`Found ${issues.length} potential issues:`);
        issues.forEach((issue, index) => {
          console.log(`\n${index + 1}. [${issue.type.toUpperCase()}]`);
          console.log(`   Found: "${issue.found}"`);
          console.log(`   Suggestion: "${issue.suggestion}"`);
          console.log(`   Context: "...${issue.context}..."`);
        });
      }

      console.log("\n" + "=".repeat(60));
    }

    await mongoose.disconnect();
    console.log("\nReview complete. Database disconnected.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

reviewBlogPosts();
