const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlockedIPSchema = new Schema({
  blockedIPArray: [{ type: String }],
});

module.exports = mongoose.model("BlockedIP", BlockedIPSchema);
