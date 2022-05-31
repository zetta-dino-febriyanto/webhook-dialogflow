var express = require('express');
var router = express.Router();
//require('../utils/database');
const moment = require('moment');

const AcadDirScheduleModel = require('../models/acaddir_schedule.model');
const MeetingScheduleModel = require('../models/meeting_schedule.model');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * API to create the academic schedule
 *
 * @param {object} req.body acaddir schedule object
 */
router.post('/acaddir_schedule', async function (req, res, next) {
  let params = req.body;
  let create = await AcadDirScheduleModel.create(params);
  res.send(create);
});

/**
 * API to create the meeting schedule between acaddir and student
 *
 * @param {object} req.body meeting schedule object
 * @param {objectId} params.user_id user id of the user login
 */
router.post('/meeting_schedule', async function (req, res, next) {
  let params = req.body;
  let student = await get_data(
    `https://api.bilip.zetta-demo.space/getUserByUserId/${params.user_id}`,
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
  let acadDir = acadDirs[0];
  let acaddirSchedule = await AcadDirScheduleModel.findOne({ acaddir_id: String(acadDir._id) }).lean();
  let meetingDate = moment.utc(params.date_schedule + params.time_schedule, 'DD/MM/YYYYHH:mm');
  let acaddirScheduleStart = moment.utc(acaddirSchedule.date_schedule + acaddirSchedule.time_start_schedule, 'DD/MM/YYYYHH:mm');
  let acaddirScheduleEnd = moment.utc(acaddirSchedule.date_schedule + acaddirSchedule.time_end_schedule, 'DD/MM/YYYYHH:mm');
  let checkMeeting = await MeetingScheduleModel.countDocuments({ acaddir_id: acadDir._id });
  if (checkMeeting < 3) {
    let checkDate = meetingDate.isBetween(acaddirScheduleStart, acaddirScheduleEnd);
    if (checkDate) {
      let create = await MeetingScheduleModel.create({ ...params, student_meeting: student._id, acaddir_id: acadDir._id });
      res.send(create);
    } else {
      res.send('failed');
    }
  } else {
    res.send('failed');
  }

});

module.exports = router;
