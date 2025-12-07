const mongoose = require("mongoose");

// Use to shorten code later on
const Schema = mongoose.Schema;

// Defining the BlogIM Schema that mongoose will use
const BlogIMSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  img: {
    type: String,
  },
  post: {
    type: String,
    required: true,
  },
  num: {
    type: Number,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

// setting the Schema
const BlogIM = mongoose.model("BlogIM", BlogIMSchema);

// Exporting the required constants
module.exports.BlogIM = BlogIM;
