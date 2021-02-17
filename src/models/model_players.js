const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playersSchema = new Schema({
    pkSkater: {type: Number, required: 'pkSkater is required', ref: 'Draft'},
    position: {type: String, required: 'position is required'},
    playerName: {type: String, required: 'playerName is required'},
    team: {type: String, required: 'team is required'},
    GamesPlayed: {type: Number, default: 0},
    Points: {type: Number, default: 0},
    PointsPerGame: {type: Number, default: 0},
    DraftYear: {type: String, default: 'Other'},
    notes: {type: String, default: null},
    drafted: {type: Number, default: 0},
    Wins: {type: Number, default: null},
    Shutouts: {type: Number, default: null},
    injury: {type: String, default: null},
    keeper: {type: Number, default: 0}
});

playersSchema.index({pkSkater: 1});

module.exports = mongoose.model('Players', playersSchema);