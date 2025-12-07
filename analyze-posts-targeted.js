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

  // Focus on actual spelling and grammar errors
  const realIssues = [
    { pattern: /\bfist\b/gi, replacement: "first", type: "spelling" },
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
    { pattern: /\bchippy's\b/gi, replacement: "chippy's", type: "punctuation" },
    { pattern: /\bI\s+am\b/gi, replacement: "I'm", type: "contraction" },
    { pattern: /\bI\s+have\b/gi, replacement: "I've", type: "contraction" },
    { pattern: /\bI\s+will\b/gi, replacement: "I'll", type: "contraction" },
    { pattern: /\bdo\s+not\b/gi, replacement: "don't", type: "contraction" },
    { pattern: /\bit\s+is\b/gi, replacement: "it's", type: "contraction" },
    { pattern: /\bthat\s+is\b/gi, replacement: "that's", type: "contraction" },
    {
      pattern: /\bthere\s+is\b/gi,
      replacement: "there's",
      type: "contraction",
    },
    {
      pattern: /\bthere\s+are\b/gi,
      replacement: "there're",
      type: "contraction",
    },
    {
      pattern: /\bthey\s+are\b/gi,
      replacement: "they're",
      type: "contraction",
    },
    { pattern: /\byou\s+are\b/gi, replacement: "you're", type: "contraction" },
    { pattern: /\bwe\s+are\b/gi, replacement: "we're", type: "contraction" },
    { pattern: /\bwas\s+not\b/gi, replacement: "wasn't", type: "contraction" },
    {
      pattern: /\bwere\s+not\b/gi,
      replacement: "weren't",
      type: "contraction",
    },
    {
      pattern: /\bhave\s+not\b/gi,
      replacement: "haven't",
      type: "contraction",
    },
    { pattern: /\bhas\s+not\b/gi, replacement: "hasn't", type: "contraction" },
    {
      pattern: /\bcould\s+not\b/gi,
      replacement: "couldn't",
      type: "contraction",
    },
    {
      pattern: /\bwould\s+not\b/gi,
      replacement: "wouldn't",
      type: "contraction",
    },
    {
      pattern: /\bshould\s+not\b/gi,
      replacement: "shouldn't",
      type: "contraction",
    },
    { pattern: /\bcan\s+not\b/gi, replacement: "can't", type: "contraction" },
    { pattern: /\bwill\s+not\b/gi, replacement: "won't", type: "contraction" },
    { pattern: /\bdid\s+not\b/gi, replacement: "didn't", type: "contraction" },
    {
      pattern: /\bdoes\s+not\b/gi,
      replacement: "doesn't",
      type: "contraction",
    },
    { pattern: /\bis\s+not\b/gi, replacement: "isn't", type: "contraction" },
    { pattern: /\bare\s+not\b/gi, replacement: "aren't", type: "contraction" },
    { pattern: /\bam\s+not\b/gi, replacement: "amn't", type: "contraction" },
    { pattern: /\bI\s+had\b/gi, replacement: "I'd", type: "contraction" },
    { pattern: /\bI\s+would\b/gi, replacement: "I'd", type: "contraction" },
    { pattern: /\bI\s+could\b/gi, replacement: "I'd", type: "contraction" },
    { pattern: /\bI\s+should\b/gi, replacement: "I'd", type: "contraction" },
    { pattern: /\blet\s+us\b/gi, replacement: "let's", type: "contraction" },
    { pattern: /\bwho\s+is\b/gi, replacement: "who's", type: "contraction" },
    { pattern: /\bwhat\s+is\b/gi, replacement: "what's", type: "contraction" },
    {
      pattern: /\bwhere\s+is\b/gi,
      replacement: "where's",
      type: "contraction",
    },
    { pattern: /\bwhen\s+is\b/gi, replacement: "when's", type: "contraction" },
    { pattern: /\bwhy\s+is\b/gi, replacement: "why's", type: "contraction" },
    { pattern: /\bhow\s+is\b/gi, replacement: "how's", type: "contraction" },
  ];

  realIssues.forEach((issue) => {
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
        console.log("✅ No obvious spelling or grammar issues found");
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
