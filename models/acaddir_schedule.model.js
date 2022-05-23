const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const acaddirScheduleModel = new Schema({
  acaddir_id: String,
  date_schedule: String,
  time_start_schedule: String,
  time_end_schedule: String,
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
  type: {
    type: String,
    enum: ['fixed', 'dynamic'],
    default: 'fixed',
  },
  day_name_schedule: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', null],
  }],
  total_student: Number,
  meeting_duration: Number,
  acaddir_timezone: Number
});

module.exports = mongoose.model('acaddir_schedule', acaddirScheduleModel);