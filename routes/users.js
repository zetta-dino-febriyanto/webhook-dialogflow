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
const DataConversationModel = require("../models/data_conversation.model");
/* GET users listing. */
router.post('/', async function (req, res, next) {


  const result = req.body;
  //Get Intent
  const intent = result.queryResult.intent.displayName;
  const language = result.queryResult.languageCode;
  const query = result.queryResult.queryText;
  const responds = result.queryResult.fulfillmentMessages;
  const id_before = result.originalDetectIntentRequest.payload.userId;
  const userIdResults = id_before.split(/[/\s]/);
  const user_id = userIdResults[0];
  let id;
  let timeZone;
  let loginAs;
  let entityData;
  if (userIdResults && userIdResults.length && userIdResults[0]) {
    id = userIdResults[0];
  }
  if (userIdResults && userIdResults.length && userIdResults[1]) {
    timeZone = userIdResults[1];
  }
  if (userIdResults && userIdResults.length && userIdResults[2]) {
    loginAs = userIdResults[2];
  }

  if (userIdResults && userIdResults.length && userIdResults[0] && userIdResults[2]) {
    let userData = await common.get_data(
      `https://api.v2.zetta-demo.space/getUserById/${id}`,
      "GET"
    );
    if (userData && userData.entities && userData.entities.length) {
      entityData = userData.entities.find((entity) => {
        if (entity && entity._id && String(entity._id) === String(userIdResults[2])) {
          return entity;
        }
      });
    }
  }

  if (result.queryResult.sentimentAnalysisResult) {


    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;


    // store the result to DB
    DataConversationModel.create({
      score,
      magnitude,
      query,
      responds,
      intent,
      user_id: id,
      school: entityData && entityData.school ? entityData.school : undefined,
      title: entityData && entityData.assigned_rncp_title ? entityData.assigned_rncp_title : undefined,
      usertype: entityData && entityData.type ? entityData.type : undefined,
      class: entityData && entityData.class ? entityData.class : undefined,
    })


    if (score < -0.85 && (intent != "Q16- Edit Job Description ? - Send" || intent != "JURY-03 The issue still not fixed")) {
      if (language == "en") {
        res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
      } else {
        res.send(createTextResponse("Désolé si ma performance est mauvaise :( S'il y a des informations auxquelles je ne peux pas répondre, vous pouvez contacter mes amis humains via la fonction Contactez-nous :)"));
      }

    }

  } else {
    const score = 0
    const magnitude = 0
    DataConversationModel.create({
      score,
      magnitude,
      query,
      responds,
      intent,
      user_id: id,
      school: entityData && entityData.school ? entityData.school : undefined,
      title: entityData && entityData.assigned_rncp_title ? entityData.assigned_rncp_title : undefined,
      usertype: entityData && entityData.type ? entityData.type : undefined,
      class: entityData && entityData.class ? entityData.class : undefined,
    })
  }
  if (intent == 'JURY-03 The issue still not fixed' || intent == "A02-Welcome Intent") {
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
    const language_code = result.queryResult.languageCode;
    //get user data
    //uncommend if on stagging



    const id_before = result.originalDetectIntentRequest.payload.userId;
    console.log(id_before)
    if (typeof id_before !== 'undefined') {
      const results = id_before.split(/[/\s]/);
      const id = results[0];

      console.log(id);
      let user = await common.get_data(
        `https://api.v2.zetta-demo.space/getUserById/${id}`,
        "GET"
      );
  
      console.log(user.first_name)
      console.log(language_code)
      //uncommend if on stagging
      // agent.add(`Hello ${user.first_name} ${user.last_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`);

      //this only for development
      let kata = "";
      if (language_code == 'en') {
        kata = `Hello ${user.first_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`;
      } else {
        kata = `Bonjour ${user.first_name}. Voici Bilip, l'assistant électronique du service d'Aide Utilisateur ADMTC.PRO. Que puis-je vous aider ?`;
      }

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
    } else {
      if (language_code == 'en') {
        kata = `Hello. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`;
      } else {
        kata = `Bonjour. Voici Bilip, l'assistant électronique du service d'Aide Utilisateur ADMTC.PRO. Que puis-je vous aider ?`;
      }
      agent.add(kata);
    }

  }

  async function jury_not_fixed(agent) {
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];
    const language_code = result.queryResult.languageCode;

    let user = await common.get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let kata = ""

    if (language_code == 'en') {
      kata = `I will redirect you to my human friend for help. Click the button below to Contact my human friend`;
    }
    else {
      kata = `Je vais vous rediriger vers mon ami humain pour obtenir de l'aide. Cliquez sur le bouton ci-dessous pour contacter mon ami humain`;
    }

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
