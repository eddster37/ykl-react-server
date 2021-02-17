//data
const {usersData} = require('./data/data_users');
const {draftData} = require('./data/data_draft');
const {playersData} = require('./data/data_players');
const {draftPlansData} = require('./data/data_draftplans');
const {draftYearsData} = require('./data/data_draft_years');

//models
const User = require('../models/model_user');
const Draft = require('../models/model_draft');
const Players = require('../models/model_players');
const Logins = require('../models/model_logins');
const DraftPlans = require('../models/model_draftplans');
const Comments = require('../models/model_comments');
const Watchlist = require('../models/model_watchlist');
const DraftYears = require('../models/model_draft_years');

class FakeDB {

    async clean() {
        await User.deleteMany({});
        await Draft.deleteMany({});
        await Players.deleteMany({});
        await Logins.deleteMany({});
        await DraftPlans.deleteMany({});
        await Comments.deleteMany({});
        await Watchlist.deleteMany({});
        await DraftYears.deleteMany({});
    }

    async addData() {
        await User.create(usersData);
        await Draft.create(draftData);
        await Players.create(playersData);
        await Logins.create();
        await Watchlist.create();
        await DraftPlans.create(draftPlansData);
        await Comments.create({fkUsername: 'Brandon', 'message': 'Comments are here!'});
        await DraftYears.create(draftYearsData);
    }
    async populate() {
        await this.clean();
        await this.addData();
    }
}

module.exports = FakeDB;