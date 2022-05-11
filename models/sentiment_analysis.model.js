const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sentimentAnalysisModel = new Schema(
  {
    score: String,
    magnitude: String,
    query: String,
    responds: [
      {
        text: {
          text: [String],
        },
        platform: String,
      },
    ],
    intent: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('sentiment_analysis', sentimentAnalysisModel);
