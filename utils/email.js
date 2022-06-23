const logError = require('debug')('error');
const logMails = require('debug')('mails');
const fs = require('fs');
const _ = require('lodash');

const mongoose = require('mongoose');
const moment = require('moment');

const common = require('./common');
const emailTemplate = require('./email_templates');
const awsService = require('../services/email/amazon-mail');

// load model in different way, because UserModel in users/index.js return undefined
// const UserModel = require('../../graphql/users/user.model');
// const NotificationHistoryModel = require('../../graphql/notificationHistories/notification_history.model');
// const MailModel = require('../../graphql/mails/mail.model');
const { resolve } = require('path');

const platformEmail = 'notification@admtc.pro'; // Email address for platform
const aideEmail = 'aide@admtc.pro';
const admtcCCEmail = 'copie.notif@admtc.pro';

const emailToSendAllEmails = 'test_email_001@zettabyte.sg'; //set this to email ID to which all emails are to be sent in all environments except production.

function sendMail(mailOptions, callback = () => { }) {
  /* mailOptions:
   *  {
   *      to : '',
   *      lang : '',
   *      subject : '',
   *      from : '',
   *      requiredParams : {}         JSON from emailTemplates.
   *  }
   */

  // *************** to block / unblock notification
  const unblockedNotifications = [
    'DUMMY_N1',
  ];

  if (unblockedNotifications.includes(mailOptions.notificationReference)) {
    // send the notification as usual
  } else {
    return callback();
  }

  let templatePath = mailOptions.htmlFR;
  let subject = mailOptions.subjectFR;
  // change language to en if provided, default fr
  if (mailOptions.language && mailOptions.language.toLowerCase() == 'en') {
    templatePath = mailOptions.htmlEN;
    subject = mailOptions.subjectEN;
  }
  // getdatauser
  let userFound = () => {
    return new Promise(async (resolve, reject) => {
      let userFoundEmail = await common.get_data(`https://api.v2.zetta-demo.space/getUserByEmail/${mailOptions.from}`, 'GET');
      if (!userFoundEmail) {
        let userFoundId = await common.get_data(`https://api.v2.zetta-demo.space/getUserById/${mailOptions.fromId}`, 'GET');
        if (userFoundId && !userFoundId.is_user_student) {
          mailOptions.from = userFoundId.email;
        } else {
          mailOptions.from = 'notification@admtc.pro';
        }

        resolve(userFoundId)
      } else {
        resolve(userFoundEmail)
      }
    });
  };

  userFound().then(function (result) {
    // read notification template html & put the data to there
    fs.readFile(templatePath, 'utf8', function (err, templateData) {
      if (err) {
        logError('Cannot send Email ', err);
        callback(err);
      } else {
        let htmlTemplate = parseTemplate(templateData, mailOptions.requiredParams);

        // add some default css
        htmlTemplate += `
      <style>
        table {
          border-collapse: collapse;
        }
      
        table,
        th,
        td {
          border: 2px solid black;
          padding: 5px;
        }
      </style>
      `;

        let recipientProperty = [],
          from = emailTemplate.from;

        // set up email recipient
        if (_.isArray(mailOptions.to)) {
          if (mailOptions.isADMTCInCC) {
            recipientProperty = mailOptions.to.concat({
              recipients: admtcCCEmail,
              rank: 'cc',
              mail_type: 'inbox',
            });
          } else {
            recipientProperty = mailOptions.to;
          }
        } else {
          recipientProperty.push({
            recipients: [mailOptions.to],
            rank: 'a',
            mail_type: 'inbox',
          });
        }

        // change sender to aide if it's notification WrgMail_N1
        if (mailOptions.notificationReference === 'WrgMail_N1') {
          from = aideEmail;
        } else if (mailOptions.from) {
          // if server is stagging sender by platform
          // if (process.env.SERVER_ENV === 'staging') {
          //   from = platformEmail;
          // } else
          // {
          if (userFound && userFound.is_email_aws_verified === true) {
            from = userFound.email;
          } else {
            from = platformEmail;
          }
          // }
        }

        let parameters = {
          sender_property: {
            sender: from,
          },
          recipient_properties: recipientProperty,
          subject: subject,
          message: htmlTemplate,
          file_attachments: mailOptions.fileAttachments,
        };
        sendCustomMail({ parameters: parameters, mailOptions: mailOptions, saveInNotificationHistory: true }, (err, newNotification) => {
          if (err) {
            return callback(err);
          }
          return callback(null, newNotification);
        });
      }
    });
  });
}


function sendCustomMail(params, callback = () => { }) {
  if (params.mailOptions.sendToPlatformMailBox === false) {
    let newNotification = {
      sender_property: params.parameters.sender_property,
      subject: params.parameters.subject,
      message: params.parameters.message,
      is_sent: false,
      recipient_properties: params.parameters.recipient_properties,
      file_attachments: params.parameters.file_attachments,
      toSaveInDb: 'false',
    };

    sendEmail(newNotification, (err) => {
      if (err) {
        logError(err);
        return callback(err);
      } else {
        let mailOptions = params.mailOptions;
        // UserModel.find({ email: params.parameters.sender_property.sender }).exec((err, user) => {
        //   if (err) {
        //     logError(err);
        //   }

        //   // save the email to notification history
        //   if (user.length) {
        //     if (mailOptions.notificationReference === 'CHANGE_COMP_CRON' || mailOptions.notificationReference === 'TESTCHECK_N1') {
        //       //do not send
        //     } else {
        //       let history = {
        //         sent_date: {
        //           date_utc: moment.utc(new Date()).format('DD/MM/YYYY'),
        //           time_utc: moment.utc(new Date()).format('HH:mm'),
        //         },
        //         notification_reference: mailOptions.notificationReference,
        //         notification_subject: params.parameters.subject,
        //         rncp_titles: mailOptions.RNCPTitleId,
        //         schools: mailOptions.schoolId,
        //         from: mailOptions.fromId ? mailOptions.fromId : user[0]._id,
        //         to: mailOptions.toId,
        //         subject: mailOptions.subjectId,
        //         test: mailOptions.testId,
        //         notification_message: params.parameters.message,
        //       };

        //       NotificationHistoryModel.create(history, (err) => {
        //         if (err) {
        //           logError(err);
        //         }
        //       });
        //     }
        //   }
        // });
      }
      return callback(null, newNotification);
    });
  } else {
    sendNotification(params, (err, newNotification) => {
      if (err) {
        logError(err);
        return callback(err);
      }

      logMails('******************************* NOTIFICATION *******************************');
      logMails('To\n', newNotification.recipientProperty);
      logMails('Subject\n', newNotification.subject);
      logMails('Mail\n', newNotification.message);

      if (params.mailOptions.sendToPersonalEmail) {
        sendEmail(newNotification, (err) => {
          if (err) {
            return callback(err);
          } else {
            if (params.saveInNotificationHistory) {
              // UserModel.find({
              //   email: params.parameters.sender_property.sender,
              // }).exec(function (err, user) {
              //   if (err) {
              //     logError(err);
              //   }
              //   if (user) {
              //     if (
              //       params.mailOptions.notificationReference === 'CHANGE_COMP_CRON' ||
              //       params.mailOptions.notificationReference === 'TESTCHECK_N1'
              //     ) {
              //       //do not send
              //     } else {
              //       let history = {
              //         sent_date: {
              //           date_utc: moment.utc(new Date()).format('DD/MM/YYYY'),
              //           time_utc: moment.utc(new Date()).format('HH:mm'),
              //         },
              //         notification_reference: params.mailOptions.notificationReference,
              //         notification_subject: params.parameters.subject,
              //         rncp_titles: params.mailOptions.RNCPTitleId,
              //         schools: params.mailOptions.schoolId,
              //         from: params.mailOptions.fromId ? params.mailOptions.fromId : user[0]._id,
              //         to: params.mailOptions.toId,
              //         subject: params.mailOptions.subjectId,
              //         test: params.mailOptions.testId,
              //         notification_message: params.parameters.message,
              //       };

              //       NotificationHistoryModel.create(history, function (err) {
              //         if (err) {
              //           logError(JSON.stringify(err, null, 2));
              //         }
              //       });
              //     }
              //   }
              // });
            }
          }
          return callback(null, newNotification);
        });
      } else {
        return callback(null, newNotification);
      }
    });
  }
}

function sendEmail(parameters, callback) {
  if (process.env.SERVER_ENV !== 'production') {
    // const originalRecipient = _.cloneDeepWith(parameters.recipient_properties);

    let to = 'Recepients: ';

    parameters.recipient_properties.forEach((recipientEach) => {
      if (recipientEach.rank === 'a') {
        to += 'To: ' + recipientEach.recipients[0];
      } else if (recipientEach.rank === 'cc') {
        to += '<br>';
        to += 'CC: ' + recipientEach.recipients[0];
      } else if (recipientEach.rank === 'c') {
        to += '<br>';
        to += 'BCC: ' + recipientEach.recipients[0];
      } else {
        to += '<br>';
        to += 'Others: ' + recipientEach.recipients[0];
      }

      if (recipientEach.rank === 'a') {
        to += '<br>';
        recipientEach.recipients[0] = emailToSendAllEmails;
      } else {
        recipientEach.recipients[0] = emailToSendAllEmails;
      }
    });

    parameters.recipient_properties = _.uniqBy(parameters.recipient_properties, 'rank');

    // if (process.env.STAGING_SEND_TO_USER_EMAIL) {
    //   parameters.recipient_properties = parameters.recipient_properties.concat(originalRecipient);
    // }

    parameters.message = to + parameters.message;
  }

  // email send with function send() for a while with same payload as send function in mail schema model
  send(parameters, (err, result) => {
    if (err) {
      return callback(err);
    }
    return callback(null, result);
  });

  // mail schema not available for a while
  // Mail.send(parameters, (err, result) => {
  //   if (err) {
  //     return callback(err);
  //   }
  //   return callback(null, result);
  // });
}

function send(mail, callback) {
  let recipients = {
    a: '',
    cc: '',
    c: '',
  };

  for (let i = 0; i < mail.recipient_properties.length; i++) {
    if (recipients[mail.recipient_properties[i].rank] !== '') recipients[mail.recipient_properties[i].rank] += ', ';
    recipients[mail.recipient_properties[i].rank] += mail.recipient_properties[i].recipients;
  }

  const AmazonMailService = require('../services/email/amazon-mail');

  let emailOptions = {
    from: mail.sender_property.sender,
    subject: mail.subject,
    to: recipients.a.split(',').map((a) => a.trim()),
    cc: recipients && recipients.cc ? recipients.cc.split(',').map((cc) => cc.trim()) : undefined,
    bcc: recipients && recipients.c ? recipients.c.split(',').map((c) => c.trim()) : undefined,
    html: mail.message,
    attachments: mail.file_attachments,
    replyTo: mail.sender_property.sender,
  };
  if (!mail.is_sent) {
    if (emailOptions.to && emailOptions.html) {
      AmazonMailService.sendMail(emailOptions, (err) => {
        if (err) {
          return callback(err);
        } else {
          // the email not saved in platform yet
          if (mail.toSaveInDb !== 'false') {
            // MailModel.updateOne({ _id: mail._id }, { $set: { is_sent: true } }).exec();
          }
        }

        return callback(null, mail);
      });
    } else {
      return callback('emailOptions.to && emailOptions.html returned false.');
    }
  } else {
    return callback('mail.is_sent is not set.');
  }
}

function sendNotification(parameters, callback) {
  let originalParams = _.cloneDeep(parameters.parameters);
  let mailOptions = parameters.mailOptions;
  let params = parameters.parameters;
  saveAttachments();

  async function saveAttachments() {
    params.attachments = [];
    let fileAttachments = [];
    if (params.file_attachments && params.file_attachments.length) {
      for (let file of params.file_attachments) {
        if (
          (file.filename && mailOptions.notificationReference === 'STATUS_UPDATE_N1') ||
          (file.filename && mailOptions.notificationReference === 'GrandDoc_N1A') ||
          (file.filename && mailOptions.notificationReference === 'GrandDoc_N1B')
        ) {
          params.attachments.push(`${common.globalUrls.apibase}/fileuploads/${file.filename}`);
          fileAttachments.push({
            file_name: `${file.filename}`,
            path: `${common.globalUrls.apibase}/fileuploads/${file.filename}`,
          });
        } else if (file.filename && file.content) {
          let random = common.create_UUID();
          let extName = file.filename.substr(file.filename.lastIndexOf('.') + 1);
          let fileName = file.filename.substr(0, file.filename.lastIndexOf('.'));
          let fullFileName = `${fileName}-${random}.${extName}`;
          params.attachments.push(`${common.globalUrls.apibase}/fileuploads/${fullFileName}`);
          fileAttachments.push({
            file_name: `${fullFileName}`,
            path: `${common.globalUrls.apibase}/fileuploads/${fullFileName}`,
          });

          let fileToS3 = {
            originalname: '',
            buffer: '',
          };

          fileToS3.buffer = file.content;
          fileToS3.originalname = fullFileName;

          await awsService.uploadToS3(fileToS3);
        }
      }
    }

    let paramsToCB = _.cloneDeep(params);
    let recipientPropertiesData = [];
    if (params.recipient_properties && params.recipient_properties.length) {
      for (let recipient of params.recipient_properties) {
        let recipientData = await common.get_data(`https://api.v2.zetta-demo.space/getUserByEmail/${recipient.recipients[0]}`, 'GET');
        if (recipientData) {
          recipientPropertiesData.push({
            recipients: recipientData._id,
            rank: recipient.rank,
            mail_type: recipient.mail_type,
          });
        }
      }
    }

    let userSender = await common.get_data(`https://api.v2.zetta-demo.space/getUserByEmail/${params.sender_property.sender}`, 'GET');
    let userPlatformEmail = await common.get_data(`https://api.v2.zetta-demo.space/getUserByEmail/${platformEmail}`, 'GET');
    let senderPropertyData = {
      sender: userSender && userSender._id ? userSender._id : userPlatformEmail._id,
      is_read: params.sender_property.is_read,
      mail_type: params.sender_property.mail_type,
    };

    console.log('data create mail')
    console.log({
      ...params,
      sender_property: senderPropertyData,
      recipient_properties: recipientPropertiesData,
      file_attachments: fileAttachments
    })

    const notifSent = await common.get_data(`https://api.v2.zetta-demo.space/createMail`, 'POST', null, {
      ...params,
      sender_property: senderPropertyData,
      recipient_properties: recipientPropertiesData,
      file_attachments: fileAttachments,
    });
    // const notifSent = await MailModel.create({
    //   ...params,
    //   sender_property: senderPropertyData,
    //   recipient_properties: recipientPropertiesData,
    //   file_attachments: fileAttachments,
    // });

    return callback(null, {
      ...paramsToCB,
      // _id: notifSent._id 
    });
  }
}

function parseTemplate(template, dataObj) {
  /* parses HTML email body.
   * can be reused application wide by emailUtil.parseTemplate.
   * functionality can be understood by seeing usage in sendMail function.
   */
  return template.replace(/\$\{.+?}/g, (match) => {
    let path = match.substr(2, match.length - 3).trim();
    return _.get(dataObj, path, '');
  });
}

module.exports = {
  sendMail
};