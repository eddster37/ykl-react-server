const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginsSchema = new Schema({
    fkUsername: {type: String, required: 'fkUsername is required'},
    result: {type: Number, default: 0},
    timestamp: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Logins', loginsSchema);