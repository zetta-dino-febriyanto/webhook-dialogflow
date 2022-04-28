const accessKeyId = process.env.AMAZON_MAIL_ACCESS_KEY;
const secretAccessKey = process.env.AMAZON_MAIL_SECRET;
const env = process.env.NODE_ENV;
const server = process.env.SERVER_ENV;

const mailUtil = require('../../utils/email');
const nodemailer = require('nodemailer');
const sesTransport = require('nodemailer-ses-transport');

const transport = nodemailer.createTransport(
  sesTransport({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    rateLimit: 10,
    region: 'eu-west-1',
    sendingRate: 5,
  })
);

function sendMail(mailOptions, next) {
  // in staging, from will be notification@admtc.pro.
  // if (server === 'staging') {
  // mailOptions.from = mailUtil.platformEmail;
  // }
  console.log('amazon mail options ', mailOptions);
  // only send when the app in production mode
  if (env === 'production') {
    if (mailOptions.to === 'aide@admtc.pro') {
      mailOptions.from = 'sos.utilisateur@admtc.pro';
    }

    transport.sendMail(mailOptions, next);
  } else {
    next();
  }
}

module.exports = {
  sendMail,
};