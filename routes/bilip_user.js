var express = require("express");
var router = express.Router();
const {
  WebhookClient,
  Image,
  Card,
  Payload,
} = require("dialogflow-fulfillment");

router.post("/", function (req, res, next) {
    //console.log(req.body.queryResult.queryText);
  
    const result = req.body;
    dialogflowfulfillment(req, res, result);
    //console.log(result);
    //Get Intent, Query, and Respond
    const intent = result.queryResult.intent.displayName;
    const query = result.queryResult.queryText;
    const responds = result.queryResult.fulfillmentMessages;
  
    // if (result.queryResult.sentimentAnalysisResult) {
    //   // console.log('Detected sentiment : ');
    //   const score =
    //     result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    //   const magnitude =
    //     result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
  
    //   //store the result to DB
    //   SentimentAnalysisModel.create({
    //     score,
    //     magnitude,
    //     query,
    //     responds,
    //     intent,
    //   });
  
    //   //  if (score < -0.3) {
    //   //     console.log("Negative Sentiment");
    //   //     res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    //   //   }
    // } else {
    //   const score = 0;
    //   const magnitude = 0;
    //   SentimentAnalysisModel.create({
    //     score,
    //     magnitude,
    //     query,
    //     responds,
    //     intent,
    //   });
    // }
  });

  const dialogflowfulfillment = (request, response, result) => {
    const agent = new WebhookClient({ request, response });
    let text = "";
    let infoContext = null;
    let intent = result.queryResult.intent.displayName;
    console.log(intent);

    function sayHello(agent) {
        agent.add("Hello")
    }
    
    let intentMap = new Map();
    intentMap.set("Default-welcome", sayHello)

    agent.handleRequest(intentMap);
  }
