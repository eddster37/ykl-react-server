const Watchlist = require('../models/model_watchlist');
const { getUsernameFromToken } = require('../controllers/controller_users');
const { isEmpty } = require('../controllers/global');

getUserWatchlistFunc = (username) => {
    return Watchlist.find(
        {fkUsername: username},
        {},
        {
            sort: {
                rank: 1
            }
        }
    )
}
exports.getUserWatchlist = async (request, response, usernameParam) => {
    let username = usernameParam;
    let res = [];

    if (!isEmpty(request) && !isEmpty(response)) {
        const token = request.headers.authorization;
        username = getUsernameFromToken(token);
    }

    await getUserWatchlistFunc(username).then(watchlist => {
        res = watchlist;
    });

    if (!isEmpty(request) && !isEmpty(response)) {
        return response.json(res);
    }
    return res;
}

exports.addToWatchlist = async (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }
    const playerID = request.body.playerID;
    let nextRank = null;

    await Watchlist.find(
        { fkUsername: username },
        { rank: 1 },
        {
            sort: {
                rank: -1
            },
            limit: 1
        }
    ).then((res) => {
        if (!res || res === undefined || res === null || res.length <= 0) {
            nextRank = 1;
        }
        else {
            nextRank = (res[0].rank + 1);
        }
    });

    const data = {
        fkUsername: username,
        fkSkater: playerID,
        rank: nextRank
    }

    await Watchlist.create(data, (error, res) => {
        if (error) {
            return response.mongoError(error);
        }
        return response.json(res);
    });
}

exports.removeFromWatchlist = async (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }

    const data = {
        fkSkater: request.body.playerID,
        fkUsername: username
    }

    //get the rank of this player we're deleting from the db
    //we could just pass it as a param, but that isn't as safe
    let rankDeleted = 1;

    await Watchlist.find(
        {
            fkUsername: username,
            fkSkater: data.fkSkater
        },
        {
            rank: 1
        },
    ).then((res) => {
        rankDeleted = parseInt(res[0].rank);
    });

    //make sure to only delete the record if the username matches
    await Watchlist.deleteOne(data, (error, res) => {
        if (error) {
            return response.mongoError(error);
        }
        //update the rest of the rankings
        Watchlist.updateMany(
            {
                fkUsername: username,
                rank: {
                    $gt: rankDeleted
                }
            },
            {
                $inc: {
                    rank: -1
                }
            },
            (error) => {
                if (error) {
                    return response.mongoError(error);
                }
                return response.json(res);
            }
        );
    });
}

exports.updateRankings = async (request, response) => {
    const token = request.headers.authorization;
    const username = getUsernameFromToken(token);

    if (!username) {
        return response.mongoError();
    }

    const data = {
        fkSkater: request.body.playerID,
        rank: request.body.newRank
    }

    let prevRank = null;

    await Watchlist.find(
        {
            fkUsername: username,
            fkSkater: data.fkSkater
        },
        {
            rank: 1
        },
    ).then((res) => {
        prevRank = parseInt(res[0].rank);
    });

    await Watchlist.updateOne(
        { fkUsername: username, fkSkater: data.fkSkater },
        data,
        (error) => {
            if (error) {
                return response.mongoError(error);
            }

            let rankFilter = [];
            let rankInc = '+1';

            //ex: prevRank: 5, newRank: 2
            //move down 2 to 3, 3 to 4, and 4 to 5
            if(prevRank > data.rank){
                rankFilter = {
                    $gte: data.rank,
                    $lt: prevRank
                };
            }
            //ex: prevRank: 2, newRank: 5
            //move up 5 to 4, 4 to 3, 3 to 2
            else{
                rankFilter = {
                    $gt: prevRank,
                    $lte: data.rank
                };
                rankInc = '-1';
            }

            Watchlist.updateMany(
                {
                    fkUsername: username,
                    fkSkater: {
                        $nin: [data.fkSkater]
                    },
                    rank: rankFilter
                },
                {
                    $inc: {
                        rank: rankInc
                    }
                },
                (error, res) => {
                    if (error) {
                        return response.mongoError(error);
                    }
                    return response.json(res);
                }
            );
        }
    );
}