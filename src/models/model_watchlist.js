const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const watchlistSchema = new Schema({
    fkUsername: {type: String, required: 'fkUsername is required'},
    fkSkater: {type: Number, ref: 'Players', required: 'fkSkater is required'},
    rank: {type: Number, required: 'rank is required'},
});

watchlistSchema.index({fkUsername: 1});
watchlistSchema.index({fkSkater: 1});
watchlistSchema.index({ fkUsername: 1, fkSkater: 1 }, {unique: true});

module.exports = mongoose.model('Watchlist', watchlistSchema);