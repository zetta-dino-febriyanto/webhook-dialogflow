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


router.post("/", async function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  console.log(result)
  dialogflowfulfillment(req, res, result);
  const intent = result.queryResult.intent.displayName;
  console.log(intent);
  const query = result.queryResult.queryText;
  console.log(query);
  const responds = result.queryResult.fulfillmentMessages;
  console.log(responds);

  const id_before = result.originalDetectIntentRequest.payload.userId;
  const userIdResults = id_before.split(/[/\s]/);
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


  //Get Intent, Query, and Respond


  if (result.queryResult.sentimentAnalysisResult) {
    // console.log('Detected sentiment : ');
    const score = result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude = result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;

    //store the result to DB
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
    });

    //  if (score < -0.85) {
    //     console.log("Negative Sentiment");
    //     res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    //   }
  } else {
    const score = 0;
    const magnitude = 0;
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
    });
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
      `https://api.v2.zetta-demo.space/getUserById/${id}`,
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
  async function sayHai(agent) {
    //get user data
    //uncommend if on stagging
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];

    console.log(id);
    let user = await common.get_data(
      `https://api.v2.zetta-demo.space/getUserById/${id}`,
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

  async function send_email(agent) {
    const id_before = result.originalDetectIntentRequest.payload.userId;
    const results = id_before.split(/[/\s]/);
    const id = results[0];
    console.log(id)
    console.log(results)
    // function to send email to user help: Dear User Help. Our customer with name <<customer name>> and email <<customer email>> have problem. Please contact them. Thank you.

    let student = await common.get_data(
      `https://api.v2.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );

    let recipients = [
      {
        recipients: ["admtcadmin2021@yopmail.com"],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
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

    agent.add("Oke, I already send an email to my human friend and CC to You. He should contact you as soon as possible. Thank You :)")
  }

  function send_email_first(agent) {
    const problem = result.queryResult.queryText;

    // Set context problem
    agent.context.set("problem", 99, {
      problem: problem,
    });

    agent.add(
      `Oke, so you want me to Send email to User Help that you have problem detail like this :`
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
    console.log(results)

    // function to send email to user help: Dear User Help. Our customer with name <<customer name>> and email <<customer email>> have problem. Please contact them. Thank you.
    let student = await common.get_data(
      `https://api.v2.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );

    let recipients = [
      {
        recipients: ["admtcadmin2021@yopmail.com"],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
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
        body: `Dear User Help. Our customer with name ${student.first_name} ${student.last_name} and email ${student.email} have problem: ${problem}. Please contact them. Thank you.`,
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

    agent.add("Oke, I already send an email to my human friend and CC to You. He should contact you as soon as possible. Thank You :)")
  }


  let intentMap = new Map();
  intentMap.set("000-General: Welcome Message", sayHai);
  intentMap.set("App-SendEmail-Yes", send_email)
  intentMap.set("000 Send_email - custom", send_email_first)
  intentMap.set("000 Send_email - custom - yes", sending_email)


  agent.handleRequest(intentMap);
};

module.exports = router;
