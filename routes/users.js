var express = require('express');
var router = express.Router();
let first_name = "";
let last_name = "";
//require('../utils/database');

const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post('/', function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  //Get Intent
  const intent = result.queryResult.intent.displayName;
 
  if (intent == "Q10- Edit Document - Send Mail"){
    //Get name and Text Messages
    const name = result.queryResult.parameters.person.name;
    const name_text = result.queryResult.queryText;
    
    console.log(name, name_text);

    //Function to send email to acad dir

    
  } else if (intent == "A04 - AppUsefull - No - Send mail - Sending"){
    const problem = result.queryResult.queryText;
    //create function to send email
    console.log(problem);
    
    res.send(createTextResponse("Thank you I Already sent email to my human Friend :)"))

  } else if(intent == "A04 - AppUsefull - No - Arrange Meeting"){
    //create function to send notification to admin that someone want meeting


    res.send(createTextResponse("Thank you, i already told my human that you want to meet him. Here is the link <link jitsi>"))
  }

  if (result.queryResult.sentimentAnalysisResult) {

    // console.log('Detected sentiment : ');
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
    const query = result.queryResult.queryText;
    const responds = result.queryResult.fulfillmentText;
    

    // console.log(score, magnitude, query, responds, intent);

    //store the result to DB
    // SentimentAnalysisModel.create({
    //   score, magnitude, query, responds, intent
    // })

    if (score > 0.4) {
      //console.log("Very Positive Sentiment");
      // res.send(createTextResponse("I'm glad that you're happy :)"));
    } else if (score < -0.3) {
      //console.log("Negative Sentiment");
      // res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    }

  } else {
    console.log('No sentiment Analysis Found');

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
