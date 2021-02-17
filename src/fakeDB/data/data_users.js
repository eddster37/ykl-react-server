const mongoose = require('mongoose');

exports.usersData = [
    {
        _id: mongoose.Types.ObjectId(),
        username: "Brandon",
        password: "GirouxMcDavid2897",
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Sharday",
        password: "GotOurGoalie2021"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Travis",
        password: "StopDraiSlander2021"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Christian",
        password: "SickJerseys2k21"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Brett",
        password: "PietroForNorris2021"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Dallas",
        password: "HeiskanenTheStud4"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Adam",
        password: "MatthewsForHart2021"
    },
    {
        _id: mongoose.Types.ObjectId(),
        username: "Mike",
        password: "HughesForNorris43",
        keeperFW: 2,
        keeperDef: 1
    }
];