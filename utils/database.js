const mongoose = require('mongoose');
//add database
mongoose.connect('mongodb://localhost/zetta_ai', err => {
    if (err) throw err;
    console.log('connected to MongoDB')
})

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log('Connection with database succeeded.');
});