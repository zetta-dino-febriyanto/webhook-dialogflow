var express = require("express");
var router = express.Router();
const {
  WebhookClient,
  Image,
  Card,
  Payload,
} = require("dialogflow-fulfillment");
// require("../utils/database");
const fetch = require("node-fetch");
const emailUtil = require("../utils/email");
const common = require("../utils/common");

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

  async function sayHello(agent) {
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    console.log(id);
    let user = await get_data(
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
              "https://raw.githubusercontent.com/zetta-dino-febriyanto/webhook-dialogflow/v2/bilip%20Head.png",
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

  let intentMap = new Map();
  intentMap.set("000-General: Welcome Message", sayHello);

  agent.handleRequest(intentMap);
};


const get_data = async (url, method, auth, data = {}) => {
  try {
    let headers = {
      // "Content-Type": "application/json",
      // "client_id": "1001125",
      // "client_secret": "876JHG76UKFJYGVHf867rFUTFGHCJ8JHV"
      Authorization: `Bearer "${auth}"`,
    };
    if (method === "POST") {
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: data,
      });
      const json = await response.json();
      return json;
    } else {
      const response = await fetch(url, { method: method, headers: headers });
      const json = await response.json();
      return json;
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = router;
