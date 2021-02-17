const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const draftSchema = new Schema({
    pick: {type: Number, required: 'pick is required'},
    via: {type: String, default: null},
    fkUsername: {type: String, required: 'fkUsername is required'},
    fkSkater: {type: Number, ref: 'Players', default: null},
    timestamp: {type: Date, default: null}
});

draftSchema.index({fkUsername: 1});
draftSchema.index({fkSkater: 1});
draftSchema.index({pick: 1});
draftSchema.index({fkSkater: 1}, {unique: true});

module.exports = mongoose.model('Draft', draftSchema);