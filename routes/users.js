var express = require('express');
var router = express.Router();
require('../utils/database');

const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post('/', function (req, res, next) {


  const result = req.body;
  //Get Intent
  const intent = result.queryResult.intent.displayName;
  const language = result.queryResult.languageCode;
  const query = result.queryResult.queryText;
  const responds = result.queryResult.fulfillmentMessages;

  if (result.queryResult.sentimentAnalysisResult) {


    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;


    // store the result to DB
    SentimentAnalysisModel.create({
      score, magnitude, query, responds, intent
    })


    if (score < -0.85 && intent != "Q16- Edit Job Description ? - Send") {
      if (language == "en") {
        res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
      } else {
        res.send(createTextResponse("Désolé si ma performance est mauvaise :( S'il y a des informations auxquelles je ne peux pas répondre, vous pouvez contacter mes amis humains via la fonction Contactez-nous :)"));
      }

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
