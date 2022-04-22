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
  console.log(result);
  //Get Intent
  const intent = result.queryResult.intent.displayName;
 
  if (intent == "Q10- Edit Document - Send Mail"){
  
    //Function to send email to acad dir
    //Notification Text : Hei Acad Dir your student with name :<first name> <last name> want to Edit Document. Plase contact him. Thank you

    res.send(createTextResponse(" Already sent a email to your Academic Director. Thank youu!"));
    
  } else if (intent == "Q17-Access Job Description - Edit - yes" || intent == "Q16- Edit Job Description ? - yes") {
  //Function to send email to acad dir
  //Notification Text : Hei Acad Dir your student with name :<first name> <last name> want to Edit Job Description. Plase contact him. Thank you
  res.send(createTextResponse(" Already sent a email to your Academic Director. Thank youu!"));

  } else if (intent == "Q12- Personal Details - yes") {
    //Function to send email to acad dir
    //Notification Text : Hei Acad Dir your student with name :<first name> <last name> want to Edit Personal Detail. Plase contact him. Thank you
    res.send(createTextResponse(" Already sent a email to your Academic Director. Thank youu!"));
  
  } else if (intent == "A04 - AppUsefull - No - Send mail - Sending"){
    const problem = result.queryResult.queryText;
    //create function to send email
    console.log(problem);
    // Notification Text : "Hello ADTMC Admin Student with Name <first name> <last name> have problem : <problem>. Please contact him, thank you!"
    
    res.send(createTextResponse("Thank you I Already sent email to my human Friend :)"))

  } else if(intent == "A04 - AppUsefull - No - Arrange Meeting"){
    //create function to send notification to admin that someone want meeting


    res.send(createTextResponse("Thank you, i already told my human that you want to meet him. Here is the link <link jitsi>"))
  } else if (intent == "A00- Doesn't work - arrange meeting"){
    //create function to send notification to admin that someone want meeting


    res.send(createTextResponse("Thank you, i already told my human that you want to meet him. Here is the link <link jitsi>"))
  } else if (intent == "A00- Doesn't work - Send Mail - Sending"){
    const problem = result.queryResult.queryText;
    //create function to send email
    console.log(problem);
    // Notification Text : "Hello ADTMC Admin Student with Name <first name> <last name> have problem : <problem>. Please contact him, thank you!"
    
    res.send(createTextResponse("Thank you I Already sent email to my human Friend :)")) 
  } else if (intent == "A02-Welcome Intent"){
    res.send(createTextResponse("Hello <first name> <last name>. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?"));

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

   if (score < -0.3) {
      console.log("Negative Sentiment");
      res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
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
