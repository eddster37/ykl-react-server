const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const draftplansSchema = new Schema({
    fkUsername: {type: String, required: 'fkUsername is required'},
    pick: {type: Number, required: 'pick is required'},
    position: {type: String, default: ''}
});

draftplansSchema.index({fkUsername: 1});
draftplansSchema.index({pick: 1});
draftplansSchema.index({ fkUsername: 1, pick: 1 }, {unique: true});

module.exports = mongoose.model('DraftPlans', draftplansSchema);