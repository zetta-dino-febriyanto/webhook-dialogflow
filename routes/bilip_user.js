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


router.post("/", function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  dialogflowfulfillment(req, res, result);
  //console.log(result);
  //Get Intent, Query, and Respond
  const intent = result.queryResult.intent.displayName;
  const query = result.queryResult.queryText;
  const responds = result.queryResult.fulfillmentMessages;

  if (result.queryResult.sentimentAnalysisResult) {
    // console.log('Detected sentiment : ');
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;

    //store the result to DB
    SentimentAnalysisModel.create({
      score,
      magnitude,
      query,
      responds,
      intent,
    });

    //  if (score < -0.85) {
    //     console.log("Negative Sentiment");
    //     res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    //   }
  } else {
    const score = 0;
    const magnitude = 0;
    SentimentAnalysisModel.create({
      score,
      magnitude,
      query,
      responds,
      intent,
    });
  }
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

    // Send response to Dialogflow
    agent.add(
      new Payload(agent.UNSPECIFIED, payloadData, {
        sendAsMessage: true,
        rawPayload: true,
      })
    );
    agent.add(kata);
  }

  async function send_email(agent) {
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    // function to send email to user help: Dear User Help. Our customer with name <<customer name>> and email <<customer email>> have problem. Please contact them. Thank you.

    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );

    let recipients = [
      {
        recipients: ["admtcadmin2021@yopmail.com"],
        rank: "a",
      },
    ];

    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: "utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html",
      htmlFR: "utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html",
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear User Help. Our customer with name ${student.first_name} ${student.last_name} and email ${student.email} have problem. Please contact them. Thank you.`,
      },
      notificationReference: "DUMMY_N1",
      RNCPTitleId: [],
      schoolId: [],
      fromId: null,
      toId: null,
      subjectId: null,
      testId: null,
      sendToPlatformMailBox: true,
    };

    //Send email
    emailUtil.sendMail(mailOptions, function (err) {
      if (err) {
        throw new Error(err);
      }
    });

    agent.add("Oke, I already send an email to my human friend. He should contact you as soon as possible. Thank You :)")
  }

  function send_email_first(agent) {
    const problem = result.queryResult.queryText;

    // Set context problem
    agent.context.set("problem", 99, {
      problem: problem,
    });

    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you have problem detail like this :`
    );
    agent.add(`"${problem}" ?`);

  }

  async function sending_email(agent) {
    infoProblem = agent.context.get("problem");
    const problem = infoProblem.parameters.problem;
    console.log(problem);
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    // function to send email to user help: Dear User Help. Our customer with name <<customer name>> and email <<customer email>> have problem. Please contact them. Thank you.
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );

    let recipients = [
      {
        recipients: ["admtcadmin2021@yopmail.com"],
        rank: "a",
      },
    ];

    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: "utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html",
      htmlFR: "utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html",
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear User Help. Our customer with name ${student.first_name} ${student.last_name} and email ${student.email} have problem. Please contact them. Thank you.`,
      },
      notificationReference: "DUMMY_N1",
      RNCPTitleId: [],
      schoolId: [],
      fromId: null,
      toId: null,
      subjectId: null,
      testId: null,
      sendToPlatformMailBox: true,
    };

    emailUtil.sendMail(mailOptions, function (err) {
      if (err) {
        throw new Error(err);
      }
    });

    agent.add("Oke, I already send an email to my human friend. He should contact you as soon as possible. Thank You :)")
  }


  let intentMap = new Map();
  intentMap.set("000-General: Welcome Message", sayHello);
  intentMap.set("App-SendEmail-Yes", send_email)
  intentMap.set("000 Send_email - custom", send_email_first)
  intentMap.set("000 Send_email - custom - yes", sending_email)


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
