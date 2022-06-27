const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataConversationModel = new Schema(
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
    user_id: String,
    school: String,
    title: String,
    usertype: String,
    class: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('data_conversation', dataConversationModel);
