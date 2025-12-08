const mongoose = require("mongoose");

const trackerSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      default: "UNKNOWN",
    },
    city: {
      type: String,
      default: "UNKNOWN",
    },
    timesVisited: {
      type: Number,
      default: 1,
    },
    lastVisitDate: {
      type: String,
      default: () => new Date().toLocaleDateString("en-GB"),
    },
    lastVisitTime: {
      type: String,
      default: () => new Date().toLocaleTimeString("en-GB", { hour12: false }),
    },
    routes: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    userAgent: {
      type: String,
      default: "UNKNOWN",
    },
    isFirstVisit: {
      type: Boolean,
      default: true,
    },
    badRequests: {
      type: Number,
      default: 0,
    },
    goodRequests: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

trackerSchema.index({ ip: 1, lastVisitDate: -1 });

module.exports = mongoose.model("Tracker", trackerSchema);
