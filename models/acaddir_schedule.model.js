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
});

module.exports = mongoose.model('acaddir_schedule', acaddirScheduleModel);