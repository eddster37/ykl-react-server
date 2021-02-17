const DraftPlans = require('../models/model_draftplans');
const User = require('../models/model_user');
const { getUsernameFromToken } = require('../controllers/controller_users');

exports.draftPlans = (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }
    DraftPlans.find(
        //search filters
        {
            fkUsername: username
        },
        //columns to return
        {},
        //sort by. -1 = DESC, 1 = ASC
        {
            sort: {
                pick: 1
            }
        },
        async (error, plans) => {
            if (error) {
                return response.mongoError(error);
            }

            let res = {};
            res['plans'] = plans;

            await User.find({ username: username }, { keeperFW: 1, keeperDef: 1 }, {}, (error, keepers) => {
                if (error) {
                    return response.mongoError(error);
                }
                res['keepers'] = keepers[0];
                return response.json(res);
            });
        }
    );
}

exports.upcoming = (username) => {
    return DraftPlans.find(
        //search filters
        {fkUsername: username},
        //columns to return
        { position: 1, pick: 1 },
        //sort by. -1 = DESC, 1 = ASC
        {
            sort: {
                pick: 1
            }
        }
    );
}

exports.update = (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }
    let numModified = 0;
    //TODO: Somehow improve this so that it doesn't do 12 updates every time no matter what?
    let draftPlans = request.body.map(plan => {
        return DraftPlans.updateOne(
            { fkUsername: username, pick: plan.pick },
            { $set: { position: plan.position } },
            (error, result) => {
                if (error) {
                    return response.mongoError(error);
                }
                else if (result.nModified > 0) {
                    numModified++;
                }
            }
        )
    });

    Promise.all(draftPlans).then(() => {
        returnPromises(response, numModified);
    });
}

returnPromises = (response, numModified) => {
    return response.json(numModified);
}