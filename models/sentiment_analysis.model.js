const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sentimentAnalysisModel = new Schema({
    score: String,
    magnitude: String,
    query: String,
    responds: String,
    intent: String
});

module.exports = mongoose.model('sentiment_analysis', sentimentAnalysisModel);