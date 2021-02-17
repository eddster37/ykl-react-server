const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentsSchema = new Schema({
    fkUsername: {type: String, required: 'fkUsername is required'},
    message: {type: String, required: 'message is required'},
    timestamp: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Comments', commentsSchema);