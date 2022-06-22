var express = require("express");
var router = express.Router();
const {
  WebhookClient,
  Payload,
} = require("dialogflow-fulfillment");
require("../utils/database");
const fetch = require("node-fetch");
const emailUtil = require("../utils/email");
const common = require("../utils/common");
const SentimentAnalysisModel = require("../models/sentiment_analysis.model");
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


    if (score < -0.85 && (intent != "Q16- Edit Job Description ? - Send" || intent !="JURY-03 The issue still not fixed")) {
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
    if(intent == 'JURY-03 The issue still not fixed' || intent == "A02-Welcome Intent"){
        dialogflowfulfillment(req, res, result);
    }
});

const dialogflowfulfillment = (request, response, result) => {
  const agent = new WebhookClient({ request, response });
  let text = "";
  let infoContext = null;
  let intent = result.queryResult.intent.displayName;
  console.log(intent);
  console.log(result);

  /**
   * The function to send the welcome response to user and check the name of the user
   *
   * @param {objectId} result.originalDetectIntentRequest.payload.userId user id of the user login
   */
   async function sayHello(agent) {
    //get user data
    //uncommend if on stagging
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    console.log(id);
    let user = await common.get_data(
      `https://api.bilip.zetta-demo.space/getUserById/${id}`,
      "GET"
    );

    // console.log(user)
    //uncommend if on stagging
    // agent.add(`Hello ${user.first_name} ${user.last_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`);

    //this only for development
    const kata = `Hello ${user.first_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`;
    var payloadData = {
      richContent: [
        [
          {
            type: "image",
            rawUrl:
              "https://raw.githubusercontent.com/zetta-dino-febriyanto/webhook-dialogflow/main/bilip%20Head.png",
            accessibilityText: "Bilip Logo",
          },
        ],
      ],
    };
    agent.add(
      new Payload(agent.UNSPECIFIED, payloadData, {
        sendAsMessage: true,
        rawPayload: true,
      })
    );
    agent.add(kata);
  }
 
  async function jury_not_fixed(agent){
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    let user = await common.get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );

    const kata = `I will redirect you to my human friend for help. Click the button below to Contact my human friend`;
    var payloadData = {
      richContent: [
        [
          {
            icon: {
              type: "chevron_right",
              color: "#FF9800"
            },
            event: {
              name: "",
              languageCode: "",
              parameters: {}
            },
            text: "WhatsApp Link",
            type: "button",
            link: `https://api.whatsapp.com/send?phone=6593722206&text=Hello, this is ${user.first_name}. I need urgent help`
          }
        ]
      ]
    };
    agent.add(kata)
    agent.add(
      new Payload(agent.UNSPECIFIED, payloadData, {
        sendAsMessage: true,
        rawPayload: true,
      })
    );
  
  }

  let intentMap = new Map();
  intentMap.set("A02-Welcome Intent", sayHello);
  intentMap.set("JURY-03 The issue still not fixed", jury_not_fixed)


  agent.handleRequest(intentMap);
};


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
