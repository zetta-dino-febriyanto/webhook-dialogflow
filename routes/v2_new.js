var express = require("express");
var router = express.Router();
const { WebhookClient } = require("dialogflow-fulfillment");
const { dialogflow, BasicCard, Suggestions } = require("actions-on-google");
const app = dialogflow();
const fetch = require("node-fetch");
const emailUtil = require("../utils/email");

//require('../utils/database');

// const SentimentAnalysisModel = require('../models/sentiment_analysis.model');

/* GET users listing. */
router.post("/", function (req, res, next) {
  //console.log(req.body.queryResult.queryText);

  const result = req.body;
  dialogflowfulfillment(req, res, result);
  //console.log(result);
  //Get Intent

  if (result.queryResult.sentimentAnalysisResult) {
    // console.log('Detected sentiment : ');
    const score =
      result.queryResult.sentimentAnalysisResult.queryTextSentiment.score;
    const magnitude =
      result.queryResult.sentimentAnalysisResult.queryTextSentiment.magnitude;
    const query = result.queryResult.queryText;
    const responds = result.queryResult.fulfillmentText;

    // console.log(score, magnitude, query, responds, intent);

    //store the result to DB
    // SentimentAnalysisModel.create({
    //   score, magnitude, query, responds, intent
    // })

    //  if (score < -0.3) {
    //     console.log("Negative Sentiment");
    //     res.send(createTextResponse("Sorry if my perfomance is bad :( If there is Information that i can't answer, you can contact my human friends through Contact Us Feature :)"));
    //   }
  } else {
    console.log("No sentiment Analysis Found");
  }
});

const dialogflowfulfillment = (request, response, result) => {
  const agent = new WebhookClient({ request, response });
  let text = "";
  let infoContext = null;
  let intent = result.queryResult.intent.displayName;
  console.log(intent);

  async function sayHello(agent) {
    //get user data
    //uncommend if on stagging
    const id = result.originalDetectIntentRequest.payload.userId;
    console.log(id);
    let user = await get_data(
      `https://api.bilip.zetta-demo.space/getUserById/${id}`,
      "GET"
    );

    // console.log(user)
    //uncommend if on stagging
    // agent.add(`Hello ${user.first_name} ${user.last_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`);

    //this only for development
    agent.add(
      `Hello ${user.first_name} ${user.last_name}. This is Bilip, the electronic assistant of the ADMTC.PRO User Help service. What can i help you?`
    );
  }
  function isEmptyObject(obj) {
    return !Object.keys(obj).length;
  }
  async function editdoc_first(agent) {
    // function to search for the next deadlines IN THE FUTURE  for doc upload
    console.log(result);
    const id = result.originalDetectIntentRequest.payload.userId;
    console.log(id);

    let tasks = await get_data(
      `https://api.bilip.zetta-demo.space/getDocExpStudentTask/${id}/5a067bba1c0217218c75f8ab`,
      "GET"
    );
    // console.log(tasks)

    let taskDatas = tasks.map((task) => {
      return `Upload Document ${task.description}`;
    });

    let taskObject = taskDatas.reduce(function (result, item, index, array) {
      result[index + 1] = item;
      return result;
    }, {});

    // Function to add search result to context
    agent.context.set("info", 999, taskObject);
    // bot response
    if (isEmptyObject(taskObject)) {
      agent.add("You don't have any deadline of test");
    } else {
      agent.add("Please Choose What Document you want to Edit: ");
      for (let [index, task] of tasks.entries()) {
        agent.add(`${index + 1}. Upload Document ${task.description}`);
      }
      agent.add("Select the number, please");
      infoContext = agent.context.get("info");
      console.log(infoContext);
    }
  }

  function editdoc_no(agent) {
    // Function to add search result to context
    infoContext = agent.context.get("info");
    // Array info[length] = [];
    // for i in Range(0, length):
    //  info.append(infoContext.parameters[i+1])

    console.log(infoContext.parameters);

    // const info1 = infoContext.parameters[1];
    // const info2 = infoContext.parameters[2];
    // const info3 = infoContext.parameters[3];

    // bot response
    agent.add("Please Choose What Document you want to Edit: ");
    // for (let [index, param] of infoContext.parameters.entries()) {
    //   agent.add(param);
    // }
    Object.keys(infoContext.parameters).map(function (key, index) {
      if (key && Number.isInteger(parseInt(key))) {
        agent.add(`${key}. ${infoContext.parameters[key]}`);
      }
    });
    agent.add("Select the number, please");
  }

  function editdoc_choose(agent) {
    const choice = agent.parameters.number;
    console.log(choice);

    agent.context.set("choice", 99, {
      choice: choice,
    });
    infoContext = agent.context.get("info");
    const test = infoContext.parameters[choice];
    agent.add(`Please confirm  you selected to change the ${test}?`);
  }

  function editdoc_choose_yes(agent) {
    infoChoice = agent.context.get("choice");
    const choice = infoChoice.parameters.choice;
    infoContext = agent.context.get("info");
    const test = infoContext.parameters[choice];
    agent.add(
      `Only Academic Director can change Your Document for ${test}. You want me to contact your Academic Director?`
    );
  }

  function editdoc_choose_no(agent) {
    agent.add(
      `Oke, I Suggest you to contact your Academic Director to edit Document, Thank You`
    );
  }

  async function editdoc_send(agent) {
    // function to get variabel from context
    infoChoice = agent.context.get("choice");
    const choice = infoChoice.parameters.choice;
    infoContext = agent.context.get("info");
    const test = infoContext.parameters[choice];

    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let data = {
      entity: "academic",
      name: "Academic Director",
      school: student.school,
      rncpTitle: student.rncp_title,
      classId: student.current_class,
    };
    console.log(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
    );
    let acadDirs = await get_data(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
      "GET"
    );

    let recipients = [
      {
        recipients: [acadDirs[0].email],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
      },
    ];

    //Function to send email to acad dir
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
        body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change the document for ${test}. ${student.first_name} ${student.last_name} please forward your document to ${acadDirs[0].first_name} ${acadDirs[0].last_name}`,
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

    // function to send  email to acad dir and CC to student

    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to change the document for ${test}. <<student name>> please forward your document to <<Acad Dir Name>>

    agent.add(
      `I Already send email to ${acadDirs[0].first_name} ${acadDirs[0].last_name} as Your Academic Director that you want to edit document about ${test} and CC to your email. Please check your Mail box`
    );
  }

  async function edit_job_desc(agent) {
    let isnotAccept = await get_data(
      `https://api.bilip.zetta-demo.space/checkJobDescAcceptByAcadDir/${id}`,
      "GET"
    );
    // Function to check is Job Description of Student is already accepted by acad dir or no
    // if already accept change <<isnotAccept>> to false
    if (!isnotAccept) {
      // function to send  email to acad dir and CC to student
      // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to change the Edit Job Description, Please Rejected his Job Description. Thank You!
      const id = result.originalDetectIntentRequest.payload.userId;
      let student = await get_data(
        `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
        "GET"
      );
      let data = {
        entity: "academic",
        name: "Academic Director",
        school: student.school,
        rncpTitle: student.rncp_title,
        classId: student.current_class,
      };
      console.log(
        `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
      );
      let acadDirs = await get_data(
        `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
        "GET"
      );

      let recipients = [
        {
          recipients: [acadDirs[0].email],
          rank: "a",
        },
        {
          recipients: [student.email],
          rank: "cc",
        },
      ];

      //Function to send email to acad dir
      let mailOptions = {
        when: "dummy notification",
        language: "",
        to: recipients,
        from: student.email,
        subjectEN: `dummy ${intent}`,
        subjectFR: `dummy ${intent}`,
        htmlEN: 'utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html',
        htmlFR: 'utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html',
        sendToPersonalEmail: true,
        requiredParams: {
          body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change the Edit Job Description, Please Rejected his Job Description. Thank You!`,
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

      agent.add(
        "I Already sent a email to your Academic Director and CC to You, please check your mail box. Thank youu!"
      );
      agent.context.delete("Q16-EditJobDescription-yes-followup");
    } else {
      agent.add(
        "Oke, Your Job Description already accepted by Your Academic Director, please tell me the detail of change you want to make."
      );
    }
  }

  function edit_job_desc_confirmation(agent) {
    const problem = result.queryResult.queryText;
    agent.context.set("job_desc", 99, {
      problem: problem,
    });
    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your Job Description with detail like this :`
    );
    agent.add(`"${problem}" ?`);
  }

  async function edit_job_desc_email(agent) {
    infoJobDesc = agent.context.get("job_desc");
    const problem = infoJobDesc.parameters.problem;
    console.log(problem);
    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let data = {
      entity: "academic",
      name: "Academic Director",
      school: student.school,
      rncpTitle: student.rncp_title,
      classId: student.current_class,
    };
    console.log(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
    );
    let acadDirs = await get_data(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
      "GET"
    );

    let recipients = [
      {
        recipients: [acadDirs[0].email],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
      },
    ];

    //Function to send email to acad dir
    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: 'utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html',
      htmlFR: 'utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html',
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change the job description with detail like this: \n ${problem} Please proceed, Thank You!`,
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
    agent.add(
      "I Already sent a email to <<Acad Dir Name>> as Your Academic Director and CC to You, please check your mail box. Thank youu!"
    );
  }

  async function send_email(agent) {
    // function to send  email to aide@ADMTC.pro and CC to student
    const problem = result.queryResult.queryText;
    console.log(problem);
    // Email Text : Hello User Help. Student with Name ${student.first_name} ${student.last_name} have problem : ${problem}. Please contact him, thank you!

    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
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
        body: `Hello User Help. Student with Name ${student.first_name} ${student.last_name} have problem : ${problem}. Please contact him, thank you!`,
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

    agent.add("Thank you I Already sent email to my human Friend :)");
  }

  function edit_identity_first(agent) {
    const problem = result.queryResult.queryText;
    agent.context.set("problem", 99, {
      problem: problem,
    });
    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your personal information with detail like this :`
    );
    agent.add(`"${problem}" ?`);
  }

  async function edit_identity_mail(agent) {
    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to change your personal information with detail like this: \n <<problem>> Please proceed, Thank You!
    infoProblem = agent.context.get("problem");
    const problem = infoProblem.parameters.problem;

    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let data = {
      entity: "academic",
      name: "Academic Director",
      school: student.school,
      rncpTitle: student.rncp_title,
      classId: student.current_class,
    };
    console.log(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
    );
    let acadDirs = await get_data(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
      "GET"
    );

    let recipients = [
      {
        recipients: [acadDirs[0].email],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
      },
    ];

    //Function to send email to acad dir
    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: 'utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html',
      htmlFR: 'utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html',
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change your personal information with detail like this: \n ${problem} Please proceed, Thank You!`,
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

    agent.add(
      `I Already sent a email to ${acadDirs[0].first_name} ${acadDirs[0].last_name} as Your Academic Director and CC to You, please check your mail box. Thank you!`
    );
  }

  function edit_address_first(agent) {
    const address = result.queryResult.queryText;
    agent.context.set("address", 99, {
      address: address,
    });

    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your address with detail like this :`
    );
    agent.add(`"${address}" ?`);
  }

  async function edit_address_mail(agent) {
    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>>  want to change your address with detail like this : \n <<Address>> Please proceed, Thank You!
    infoAddress = agent.context.get("address");
    const Address = infoAddress.parameters.address;
    console.log(Address);
    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let data = {
      entity: "academic",
      name: "Academic Director",
      school: student.school,
      rncpTitle: student.rncp_title,
      classId: student.current_class,
    };
    console.log(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
    );
    let acadDirs = await get_data(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
      "GET"
    );

    let recipients = [
      {
        recipients: [acadDirs[0].email],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
      },
    ];

    //Function to send email to acad dir
    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: 'utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html',
      htmlFR: 'utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html',
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change your address with detail like this: \n ${Address} Please proceed, Thank You!`,
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

    agent.add(
      `I Already sent a email to ${acadDirs[0].first_name} ${acadDirs[0].last_name} as Your Academic Director and CC to You, please check your mail box. Thank you!`
    );
  }

  function edit_parent_first(agent) {
    const parent = result.queryResult.queryText;
    agent.context.set("parent", 99, {
      parent: parent,
    });

    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your Parent Information with detail like this :`
    );
    agent.add(`"${parent}" ?`);
  }

  async function edit_parent_mail(agent) {
    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>>  want to change your parent information with detail like this : \n <<Parent>> Please proceed, Thank You!
    infoParent = agent.context.get("parent");
    const Parent = infoParent.parameters.parent;
    console.log(Parent);
    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    let data = {
      entity: "academic",
      name: "Academic Director",
      school: student.school,
      rncpTitle: student.rncp_title,
      classId: student.current_class,
    };
    console.log(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`
    );
    let acadDirs = await get_data(
      `https://api.bilip.zetta-demo.space/getUserFromEntityNameSchoolRncpClass/${data.entity}/${data.name}/${data.school}/${data.rncpTitle}/${data.classId}`,
      "GET"
    );

    let recipients = [
      {
        recipients: [acadDirs[0].email],
        rank: "a",
      },
      {
        recipients: [student.email],
        rank: "cc",
      },
    ];

    //Function to send email to acad dir
    let mailOptions = {
      when: "dummy notification",
      language: "",
      to: recipients,
      from: student.email,
      subjectEN: `dummy ${intent}`,
      subjectFR: `dummy ${intent}`,
      htmlEN: 'utils/email_templates/Dummy_Notification/DUMMY_N1/EN.html',
      htmlFR: 'utils/email_templates/Dummy_Notification/DUMMY_N1/FR.html',
      sendToPersonalEmail: true,
      requiredParams: {
        body: `Dear ${acadDirs[0].first_name} ${acadDirs[0].last_name}. ${student.first_name} ${student.last_name} want to change your parent information with detail like this: \n ${Parent} Please proceed, Thank You!`,
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

    agent.add(
      `I Already sent a email to ${acadDirs[0].first_name} ${acadDirs[0].last_name} as Your Academic Director and CC to You, please check your mail box. Thank you!`
    );
  }

  async function edit_mentor_first(agent) {
    // Function to search Mentor of Student
    const id = result.originalDetectIntentRequest.payload.userId;
    let student = await get_data(
      `https://api.bilip.zetta-demo.space/getUserByUserId/${id}`,
      "GET"
    );
    if (student && student.companies && student.companies.length) {
      let companyData = student.companies.find((company) => company && company.status && company.status === 'active' && company.mentor);
      if (companyData && companyData.mentor) {
        let mentor = await get_data(
          `https://api.bilip.zetta-demo.space/getUserById/${companyData.mentor}`,
          "GET"
        );

        if (mentor && mentor._id) {
          agent.add(
            `Your old mentor is ${mentor.first_name} ${mentor.last_name}. Please enter email of new mentor.`
          );
        } else {
          agent.add('mentor not found');
        }
      } else {
        agent.add('mentor not found');
      }
    } else {
      agent.add('mentor not found');
    }
  }

  function edit_mentor_confirmation(agent) {
    const mentor = result.queryResult.parameters.email;
    agent.context.set("mentor", 99, {
      mentor: mentor,
    });

    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your Mentor and the email of new mentor is ${mentor}?`
    );
  }

  function edit_mentor_mail(agent) {
    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to change mentor with the email of new mentor is <<Mentor>> Please proceed, Thank You!
    infoMentor = agent.context.get("mentor");
    const Mentor = infoMentor.parameters.mentor;
    console.log(Mentor);

    agent.add(
      "I Already sent a email to <<Acad Dir Name>> as Your Academic Director and CC to You, please check your mail box. Thank youu!"
    );
  }

  function edit_date_first(agent) {
    const date = result.queryResult.queryText;
    agent.context.set("date", 99, {
      date: date,
    });

    agent.add(
      `Oke, so you want me to Send email to your Academic Director that you want to change your Contract Date with detail like this :`
    );
    agent.add(`"${date}" ?`);
  }

  function edit_date_mail(agent) {
    // function to send  email to acad dir and CC to student
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to Contract Date with detail like this: <<date>>. Please proceed, Thank You!
    infoDate = agent.context.get("date");
    const date = infoDate.parameters.date;
    console.log(date);

    agent.add(
      "I Already sent a email to <<Acad Dir Name>> as Your Academic Director and CC to You, please check your mail box. Thank youu!"
    );
  }

  function cancel_contract(agent) {
    // Function to get student name
    // Email Text : Dear <<Acad Dir Name>>. <<Student Name>> want to Cancel the Contract of Company, Please proceed. Thank You!

    agent.add(
      "I Already sent a email to <<Acad Dir Name>> as Your Academic Director and CC to You, please check your mail box. Thank youu!"
    );
  }

  let intentMap = new Map();

  // Welcome Intent
  intentMap.set("A02-Welcome Intent", sayHello);

  // For Edit Document
  intentMap.set("Q10- Edit Document", editdoc_first);
  intentMap.set("Q10- Edit Document - lists", editdoc_choose);
  intentMap.set("Q10- Edit Document - lists - yes", editdoc_choose_yes);
  intentMap.set("Q10- Edit Document - lists - yes - yes", editdoc_send);
  intentMap.set("Q10- Edit Document - lists - yes - no", editdoc_choose_no);
  intentMap.set("Q10- Edit Document - lists - no", editdoc_no);

  // Job Description
  intentMap.set("Q17-Access Job Description - Edit - yes", edit_job_desc);
  intentMap.set("Q16- Edit Job Description ? - yes", edit_job_desc);
  intentMap.set(
    "Q16- Edit Job Description ? - yes - detail",
    edit_job_desc_confirmation
  );
  intentMap.set(
    "Q16- Edit Job Description ? - yes - detail - yes",
    edit_job_desc_email
  );
  intentMap.set(
    "Q17-Access Job Description - Edit - yes - detail",
    edit_job_desc_confirmation
  );
  intentMap.set(
    "Q17-Access Job Description - Edit - yes - detail - yes",
    edit_job_desc_email
  );

  // App not usefull
  intentMap.set("A04 - AppUsefull - No - yes - sending", send_email);
  intentMap.set("A00- Doesn't work - yes - sendmail", send_email);

  // Edit Identity - Personal Information
  intentMap.set(
    "Q12- Personal Details - personal - yes - detail",
    edit_identity_first
  );
  intentMap.set(
    "Q12- Personal Details - personal - yes - detail - yes",
    edit_identity_mail
  );
  intentMap.set("Q12_1 - personal - yes - detail", edit_identity_first);
  intentMap.set("Q12_1 - personal - yes - detail - yes", edit_identity_mail);

  // Edit Identity - Address
  intentMap.set(
    "Q12- Personal Details - address - yes - confirmation",
    edit_address_first
  );
  intentMap.set(
    "Q12- Personal Details - address - yes - confirmation - yes",
    edit_address_mail
  );
  intentMap.set("Q12_2 - address - yes - confirmation", edit_address_first);
  intentMap.set(
    "Q12_2 - address - yes - confirmation - yes",
    edit_address_mail
  );

  // Edit  Identity - Parent
  intentMap.set(
    "Q12- Personal Details - parent - yes - detail",
    edit_parent_first
  );
  intentMap.set(
    "Q12_3 - parent - yes - detail",
    edit_parent_first
  );
  intentMap.set(
    "Q12- Personal Details - parent - yes - detail - yes",
    edit_parent_mail
  );
  intentMap.set(
    "Q12_3 - parent - yes - detail - yes",
    edit_parent_mail
  );
  
  // Information Company/Mentor
  intentMap.set(
    "Q01- Information company / mentor - mentor - yes",
    edit_mentor_first
  );
  intentMap.set(
    "Q01_1 - mentor - yes",
    edit_mentor_first
  );
  intentMap.set(
    "Q01- Information company / mentor - mentor - yes - confirmation",
    edit_mentor_confirmation
  );
  intentMap.set(
    "Q01_1 - mentor - yes - confirmations",
    edit_mentor_confirmation
  );
  intentMap.set(
    "Q01- Information company / mentor - mentor - yes - confirmation - yes",
    edit_mentor_mail
  );
  intentMap.set(
    "Q01_1 - mentor - yes - confirmations - yes",
    edit_mentor_mail
  );
  

  intentMap.set(
    "Q01- Information company / mentor - contract - yes",
    cancel_contract
  );
  intentMap.set(
    "Q01_2 - cancel_contract - yes",
    cancel_contract
  );
  intentMap.set(
    "Q01- Information company / mentor - mentor - yes - confirmation - no",
    edit_mentor_first
  );
  intentMap.set(
    "Q01_1 - mentor - yes - confirmations - no",
    edit_mentor_first
  );
  
  intentMap.set(
    "Q01- Information company / mentor - date - yes - date",
    edit_date_first
  );
  intentMap.set(
    "Q01- Information company / mentor - date - yes - date - yes",
    edit_date_mail
  );
  

  agent.handleRequest(intentMap);
};

function createTextResponse(textresponse) {
  let response = {
    fulfillmentMessages: [
      {
        text: {
          text: [textresponse],
        },
      },
    ],
  };

  return response;
}

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
