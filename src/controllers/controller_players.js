const Players = require('../models/model_players');

exports.getTeams = (request, response) => {
    Players.distinct(
        "team",
        (error, teams) => {
            if(error){
                return response.mongoError(error);
            }
            return response.json(teams);
        }
    )
}

exports.getPlayerStats = (request, response) => {
    Players.find(
        {
            drafted: 0,
            keeper: 0
        },
        {},
        {
            sort: {
                Points: -1
            }
        },
        (error, players) => {
            if (error) {
                return response.mongoError(error);
            }
            return response.json(players);
        }
    )
}