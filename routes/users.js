var express = require('express');
var router = express.Router();
require('../utils/database');

const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post('/', function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  if (result.queryResult.sentimentAnalysisResult) {

    console.log('Detected sentiment : ');
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
    const query = result.queryResult.queryText;
    const responds = result.queryResult.fulfillmentText;
    const intent = result.queryResult.intent.displayName;

    console.log(score, magnitude, query, responds, intent);

    //store the result to DB
    SentimentAnalysisModel.create({
      score, magnitude, query, responds, intent
    })

    if (score > 0.4) {
      console.log("Very Positive Sentiment");
      res.send(createTextResponse("I'm glad that you're happy :)"));
    } else if (score < -0.3) {
      console.log("Negative Sentiment");
      res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    }

  } else {
    console.log('No sentiment Analysis Found');
    console.log(req.body);
  }
});

function createTextResponse(textresponse) {
  let response = {
    "fulfillmentMessages": [
      {
        "text": {
          "text": [
            textresponse
          ]
        }
      }
    ]
  }

  return response;
}
module.exports = router;
