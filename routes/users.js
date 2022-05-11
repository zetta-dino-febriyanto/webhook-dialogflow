var express = require('express');
var router = express.Router();
require('../utils/database');

const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post('/', function (req, res, next) {
 

  const result = req.body;
  //Get Intent
  const intent = result.queryResult.intent.displayName;
  const query = result.queryResult.queryText;
  const responds = result.queryResult.fulfillmentText;

  if (result.queryResult.sentimentAnalysisResult) {

    
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
   
    

    

    // store the result to DB
    SentimentAnalysisModel.create({
      score, magnitude, query, responds, intent
    })

    if (score < -0.8) {
      res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    }

  } else {
    const score = 0
    const magnitude = 0
     SentimentAnalysisModel.create({
     score, magnitude, query, responds, intent
    })

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
