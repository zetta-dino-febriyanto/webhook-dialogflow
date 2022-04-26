var express = require('express');
var router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
const {dialogflow, BasicCard, Suggestions} = require('actions-on-google');
const app = dialogflow();

//require('../utils/database');

// const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post('/', function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  dialogflowfulfillment(req, res, result);
  //console.log(result);
  //Get Intent
 
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


const dialogflowfulfillment = (request, response, result) => {
  const agent = new WebhookClient({request, response});
  let text = "";
  let infoContext = null;

  function sayHello(agent){
    //get user data
    //uncommend if on stagging
    // const id = result.originalDetectIntentRequest.payload.userId;
    // console.log(id)
    // let user = await get_data(`https://api.bilip.zetta-demo.space/getUserById/${id}`, 'GET');

    // console.log(user)
    //uncommend if on stagging
    // agent.add(`Hello ${user.first_name} ${user.last_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`);


    //this only for development
    agent.add(`Hello <<user.first_name>> <<user.last_name>>. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`);
  }

  function editdoc_first(agent){
    // const infoContext = agent.context;
    // console.log(result.queryResult.outputContexts);
    // const token = infoContext.parameters.token;

    // function to search for the next deadlines IN THE FUTURE  for doc upload


    // Function to add search result to context
    agent.context.set('info', 99, {
      1: "<<Search 1>>",
      2: "<<Search 2>>",
      3: "<<Search 3>>"
    });
    // bot response
    agent.add("Please Choose What Document you want to Edit: ");
    agent.add("1. <<Search 1>>");
    agent.add("2. <<Search 2>>");
    agent.add("3. <<Search 3>>");
    agent.add("Select the number, please");
    
  }

  function editdoc_no(agent){
    // Function to add search result to context
    infoContext = agent.context.get('info');
    const info1 = infoContext.parameters[1];
    const info2 = infoContext.parameters[2];
    const info3 = infoContext.parameters[3];

    // bot response
    agent.add("Please Choose What Document you want to Edit: ");
    agent.add(`1. ${info1}`);
    agent.add(`2. ${info2}`);
    agent.add(`3. ${info3}`);
    agent.add("Select the number, please");
    
  }

  function editdoc_choose(agent){
    const choice = agent.parameters.number;
    console.log(choice);

    agent.context.set('choice', 99, {
      choice: choice
    });
    infoContext = agent.context.get('info');
    const test = infoContext.parameters[choice];
    agent.add(`Please confirm  you selected to change the ${test}?`);
  }

  function editdoc_choose_yes(agent){
    infoChoice = agent.context.get('choice')
    const choice = infoChoice.parameters.choice;
    infoContext = agent.context.get('info');
    const test = infoContext.parameters[choice];
    agent.add(`Only Academic Director can change Your Document for ${test}. You want me to contact your Academic Director?`);
  }

  function editdoc_choose_no(agent){
    // infoChoice = agent.context.get('choice')
    // const choice = infoChoice.parameters.choice;
    // infoContext = agent.context.get('info');
    // const test = infoContext.parameters[choice];
    agent.add(`Oke, I Suggest you to contact your Academic Director to edit Document, Thank You`);
  }

  function editdoc_send(agent) {
    // function to get variabel from context
    infoChoice = agent.context.get('choice')
    const choice = infoChoice.parameters.choice;
    infoContext = agent.context.get('info');
    const test = infoContext.parameters[choice];

    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to change the document for ${test}. <<student name>> please forward your document to <<Acad Dir Name>> 

    agent.add(`I Already send email to <<acad dir>> as Your Academic Director that you want to edit document about ${test} and CC to your email. Please check your Mail box`)
    
  }

  let intentMap = new Map();
  // Welcome Intent
  intentMap.set("A02-Welcome Intent",sayHello);

  // For Edit Document
  intentMap.set("Q10- Edit Document", editdoc_first);
  intentMap.set("Q10- Edit Document - lists", editdoc_choose);
  intentMap.set("Q10- Edit Document - lists - yes", editdoc_choose_yes);
  intentMap.set("Q10- Edit Document - lists - yes - yes", editdoc_send);
  intentMap.set("Q10- Edit Document - lists - yes - no", editdoc_choose_no);
  // intentMap.set("Q10- Edit Document - lists - no", editdoc_no);


  

  agent.handleRequest(intentMap);


}
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
