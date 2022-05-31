const mongoose = require('mongoose');
//add database
mongoose.connect(`mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`, err => {
    if (err) throw err;
    console.log('connected to MongoDB')
})

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log('Connection with database succeeded.');
});