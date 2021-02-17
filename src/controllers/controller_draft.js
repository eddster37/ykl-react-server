const Draft = require('../models/model_draft');
const Player = require('../models/model_players');
const Comments = require('../models/model_comments');
const User = require('../models/model_user');
const { isEmpty } = require('../controllers/global');
const { getUsernameFromToken } = require('../controllers/controller_users');

const getCurrDrafterAndPickFunc = () => {
    return Draft.find(
        { fkSkater: null },
        {
            pick: 1,
            fkUsername: 1
        },
        {
            sort: {
                pick: 1
            },
            limit: 1
        }
    )
}

const getPicksFunc = () => {
    return Draft.aggregate(
        [
            {
                $lookup: {
                    //collection to join
                    from: 'players',
                    localField: "fkSkater",
                    foreignField: "pkSkater",
                    as: 'Player'
                }
            },
            {
                //sort by -1 = DESC, 1 = ASC
                $sort: {
                    pick: 1
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                $arrayElemAt: ["$Player", 0]
                            },
                            "$$ROOT"
                        ]
                    }
                }
            },
            {
                $project: {
                    via: 1,
                    fkSkater: 1,
                    pick: 1,
                    fkUsername: 1,
                    timestamp: 1,
                    playerName: 1,
                    position: 1,
                    injury: 1
                }
            }
        ]
    );
}

const getOnlineUsersFunc = () => {
    return User.find(
        {loggedIn: 1},
        {username: 1},
        {}
    );
}

exports.getPicks = async (request, response) => {
    let res = {};
    await getPicksFunc().then(picks => {
        res['picks'] = picks;
    });
    await getCurrDrafterAndPickFunc().then(data => {
        res['currentDrafter'] = data[0]['fkUsername'];
        res['currentPick'] = data[0]['pick'];
    });
    if(response !== undefined && response !== null){
        return response.json(res);
    }
    else{
        return res;
    }
}

exports.getOnlineUsers = async (request, response) => {
    let token, username = '';
    let returnRes = {onlineUsers: '', username: ''};

    if(!isEmpty(request) && !isEmpty(response)){
        token = request.headers.authorization;
        username = getUsernameFromToken(token);

        if(!username){
            return response.mongoError();
        }
    }

    await getOnlineUsersFunc().then(async res => {
        await res.map(u => {
            returnRes['onlineUsers'] += u.username + ", ";
        });
        returnRes['onlineUsers'] = returnRes['onlineUsers'].slice(0, -2);
        returnRes['username'] = username;
    });
    if(response !== undefined && response !== null){
        return response.json(returnRes);
    }
    else{
        return returnRes;
    }
}

exports.getComments = (request, response) => {
    return Comments.find(
        {},
        {},
        {
            sort: {
                timestamp: 1
            }
        },
        (error, comments) => {
            if (error && !isEmpty(response)) {
                return response.mongoError(error);
            }
            if(!isEmpty(response)){
                return response.json(comments);
            }
            else{
                return comments;
            }
        }
    );
}

exports.getUserRoster = (request, response) => {
    const token = request.headers.authorization;
    let username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }

    const userRoster = request.body.username;

    if (!isEmpty(userRoster)) {
        username = userRoster;
    }

    Draft.aggregate(
        [
            {
                $lookup: {
                    //collection to join
                    from: 'players',
                    localField: "fkSkater",
                    foreignField: "pkSkater",
                    as: 'Player'
                }
            },
            {
                $match: {
                    "fkUsername": { $in: [username] },
                    "fkSkater": { $ne: null}
                }
            },
            {
                //sort by -1 = DESC, 1 = ASC
                $sort: {
                    keeper: -1,
                    pick: 1
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                $arrayElemAt: ["$Player", 0]
                            },
                            "$$ROOT"
                        ]
                    }
                }
            },
            {
                $project: {
                    pick: 1,
                    playerName: 1,
                    position: 1,
                    injury: 1,
                    fkUsername: 1
                }
            }
        ],
        async (error, roster) => {
            if (error) {
                return response.mongoError(error);
            }
            returnRes = {};
            returnRes['userRoster'] = username;
            returnRes['roster'] = roster;
            return response.json(returnRes);
        }
    );
}

exports.selectPlayer = (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }

    const { skaterID } = request.body;
    let nextPick = null;

    Player.updateOne(
        { pkSkater: skaterID },
        { drafted: 1 },
        (error, res) => {
            if (error || !res) {
                return response.mongoError(error);
            }
            Draft.find(
                { fkSkater: null },
                { pick: 1 },
                {
                    sort: {
                        pick: 1
                    },
                    limit: 1
                },
                (error, res) => {
                    if (error || res[0].pick === undefined) {
                        return response.mongoError(error);
                    }
                    if(res[0] !== undefined && res[0]['pick'] !== undefined) {
                        nextPick = res[0]['pick'];
                    }

                    Draft.updateOne(
                        { pick: nextPick },
                        { fkSkater: skaterID, timestamp: Date.now() },
                        {},
                        (error, res) => {
                            if (error) {
                                return response.mongoError(error);
                            }
                            return response.json(res);
                        }
                    )
                }
            );
        }
    );
}

exports.postComment = (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }
    const { message } = request.body;

    Comments.create(
        { fkUsername: username, message },
        (error, res) => {
            if (error) {
                return response.mongoError(error);
            }
            return response.json(res);
        });
}