const readline = require("readline");
const mongoose = require("mongoose");
require("dotenv").config();

// Import models and utilities
const User = require("../models/user");
const { Meal } = require("../models/meal");
const { Ingredient } = require("../models/ingredient");
const { ShoppingList } = require("../models/shoppingList");
const { Category } = require("../models/category");

// Database connection
const dbName = "slapp";
const dbUrl =
  "mongodb+srv://hutch:" +
  process.env.MONGODB +
  "@hutchybop.kpiymrr.mongodb.net/" +
  dbName +
  "?retryWrites=true&w=majority&appName=hutchyBop";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility functions for user input
const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function deleteUserAccount() {
  try {
    console.log("🗑️  User Account Deletion Utility\n");

    // Connect to database
    await mongoose.connect(dbUrl);
    console.log("✅ Connected to database\n");

    // Get email from user
    const email = await question("Enter email address of user to delete: ");

    if (!email || !email.includes("@")) {
      console.log("❌ Invalid email address");
      rl.close();
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      rl.close();
      return;
    }

    // Display user info
    console.log("\n👤 User found:");
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id}`);

    // Check for protected accounts
    if (user.username === "defaultMeals") {
      console.log(`\n❌ Cannot delete protected account: ${user.username}`);
      rl.close();
      return;
    }

    // Confirm deletion
    console.log("\n⚠️  WARNING: This will permanently delete:");
    console.log("   • User account");
    console.log("   • All meals");
    console.log("   • All ingredients");
    console.log("   • All shopping lists");
    console.log("   • All categories");
    console.log("   • All associated data");

    const confirm1 = await question('\nType "DELETE" to confirm: ');
    if (confirm1 !== "DELETE") {
      console.log("❌ Deletion cancelled");
      rl.close();
      return;
    }

    const confirm2 = await question("Are you absolutely sure? (yes/no): ");
    if (confirm2.toLowerCase() !== "yes") {
      console.log("❌ Deletion cancelled");
      rl.close();
      return;
    }

    // Perform deletion (same logic as controller)
    console.log("🗑️  Deleting user data...");

    const userEmail = user.email; // Store email before deletion

    await Ingredient.deleteMany({ author: user._id });
    console.log("   ✅ Ingredients deleted");

    await Category.deleteMany({ author: user._id });
    console.log("   ✅ Categories deleted");

    await Meal.deleteMany({ author: user._id });
    console.log("   ✅ Meals deleted");

    await ShoppingList.deleteMany({ author: user._id });
    console.log("   ✅ Shopping lists deleted");

    await User.findByIdAndDelete(user._id);
    console.log("   ✅ User account deleted");

    console.log(`\n🎉 Successfully deleted account for '${userEmail}'`);
  } catch (error) {
    console.error("❌ Error during deletion:", error.message);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    if (rl) {
      rl.close();
    }
    console.log("\n👋 Utility finished");
  }
}

// Run utility
deleteUserAccount().catch(console.error);
