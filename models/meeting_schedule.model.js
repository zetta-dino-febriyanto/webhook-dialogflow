const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingScheduleModel = new Schema({
  date_schedule: String,
  time_schedule: String,
  user_meeting: String,
  student_meeting: String,
  link: String,
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
  type: {
    type: String,
    enum: ['offline', 'online'],
    default: 'online',
  },
});

module.exports = mongoose.model('meeting_schedule', meetingScheduleModel);