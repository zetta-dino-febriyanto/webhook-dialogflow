var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/', function(req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  if (result.queryResult.sentimentAnalysisResult) {
    console.log('Detected sentiment : ');
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
   
    if (score>0.4){
      console.log("Very Positive Sentiment");
      res.send(createTextResponse("I'm glad that you're happy :)"));
    } else if (score<-0.3) {
      console.log("Negative Sentiment");
      res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends on lalala@email.com :)"));
    }

  } else {
    console.log('No sentiment Analysis Found');
    console.log(req.body);
  } 
});

function createTextResponse(textresponse){
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
