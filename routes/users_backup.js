var express = require('express');
var router = express.Router();
require('../utils/database');

const DataConversationModel = require('../models/data_conversation.model');

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

    if (intent == 'JURY-03 The issue still not fixed') {
      res.send(createTextResponse("I will redirect you to my human friends for help <Link to WA Aide jury>"));
      res.send(createTextResponse("I will redirect you to my human friends for help <Link to WA Aide jury>"));
    }

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
