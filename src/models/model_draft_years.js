const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const draftYearsSchema = new Schema({
    year: {type: String, required: 'year is required'}
});

draftYearsSchema.index({ year: 1 }, {unique: true});

module.exports = mongoose.model('DraftYears', draftYearsSchema);