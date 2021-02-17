const express = require('express');
const app = express();
const fs = require('fs');

//socket stuff
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
    }
});
const PORT = process.env.PORT || 3001;

//routes
const usersRoutes = require('./routes/route_users');
const playersRoutes = require('./routes/route_players');
const draftPlansRoutes = require('./routes/route_draftplans');
const watchlistRoutes = require('./routes/route_watchlist');
const draftRoutes = require('./routes/route_draft');
const draftYearsRoutes = require('./routes/route_draft_years');

//controllers
const { isEmpty } = require('./controllers/global');
const { onlyAuthUser } = require('./controllers/controller_users');

const { getPicks } = require('./controllers/controller_draft');
const { getComments } = require('./controllers/controller_draft');
const { upcoming } = require('./controllers/controller_draftplans');
const { getUserWatchlist } = require('./controllers/controller_watchlist');

//database
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { provideErrorHandler } = require('./middlewares');
require('dotenv').config();

mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}, () => {
    console.log("Connected to db!");
});

//Middleware
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(provideErrorHandler);

//Api routes
app.use('/api/users', usersRoutes);
app.use('/api/players', onlyAuthUser, playersRoutes);
app.use('/api/draftplans', onlyAuthUser, draftPlansRoutes);
app.use('/api/watchlist', onlyAuthUser, watchlistRoutes);
app.use('/api/draft', onlyAuthUser, draftRoutes);
app.use('/api/draftyears', onlyAuthUser, draftYearsRoutes);

//socket work
let interval = null;
const _ = require('lodash');

//storage!
let draftPicksArr = [];
let draftOrderArr = [];
let commentsArr = [];
let rostersArr = [];
let onlineUsersStrArr = [];
let currentPickArr = [];
let currentDrafterArr = [];
let loadedRoomArr = [];
let indexesArr = [];
let upcomingDraftPlansArr = [];
let watchlistsArr = [];

io.on("connection", async (socket) => {
    if (socket.handshake.query.room === undefined) {
        socket.disconnect();
    }

    const room = socket.handshake.query.room;
    console.log("Connected client to " + room);

    //only do this once; when the room has yet to be instantiated
    if (isEmpty(loadedRoomArr[room]) || loadedRoomArr[room] === false) {
        loadedRoomArr[room] = true;
        try {
            draftPicksArr[room] = [];
            rostersArr[room] = [];
            upcomingDraftPlansArr[room] = [];
            watchlistsArr[room] = [];

            await getPicks().then(res => {
                draftOrderArr[room] = res['picks'];
                currentDrafterArr[room] = res['currentDrafter'];
                currentPickArr[room] = res['currentPick'];
                indexesArr[room] = 0;

                let count = 0;
                draftOrderArr[room].forEach(p => {
                    if(!isEmpty(p.fkSkater)){
                        draftPicksArr[room][count] = p;
                        if(isEmpty(rostersArr[room][p.fkUsername])){
                            rostersArr[room][p.fkUsername] = [];
                        }
                        rostersArr[room][p.fkUsername].push(p);
                    }
                    count++;
                });
            }).catch();

            await getComments().then(comments => {
                commentsArr[room] = comments;
            }).catch();
        }
        catch (error) {
            console.log(error);
        }
    }

    socket.on("getUserWatchlist", username => {
        const userWatchlist = watchlistsArr[room][username];
        //if user watchlist is empty, then get and set the watchlist
        if(isEmpty(userWatchlist)){
            getUserWatchlist(null, null, username).then(watchlist => {
                watchlistsArr[room][username] = watchlist;
                socket.emit("setUserWatchlist", watchlist);
            });
        }
        else{
            socket.emit("setUserWatchlist", userWatchlist);
        }
    });

    socket.on("addToWatchlist", (username, fkSkater) => {
        const userWatchlist = watchlistsArr[room][username];

        const nextRank = userWatchlist.length + 1;
        userWatchlist.push({_id: mongoose.Types.ObjectId(), fkUsername: username, fkSkater: fkSkater, rank: nextRank, __v: 0});
        socket.emit("setUserWatchlist", userWatchlist);
    });

    socket.on("removeFromWatchlist", async (username, fkSkater) => {
        const userWatchlist = watchlistsArr[room][username];

        let index = 0;
        let indexToDel = null;
        let tmpWatchlist = _.cloneDeep(userWatchlist);

        await userWatchlist.forEach(player => {
            if(player.fkSkater === fkSkater && indexToDel === null){
                indexToDel = index;
            }
            //if the player to remove has been found, we need to move the rest of the players "up"
            //ex: delete the #12 ranked player when there's 15 in the list, we need to move
            //#13 to 12, #14 to 13 and #15 to 14. 
            else if(indexToDel !== null){
                tmpWatchlist[index].rank = (tmpWatchlist[index].rank - 1);
            }
            index++;
        });

        tmpWatchlist.splice(indexToDel, 1);
        watchlistsArr[room][username] = tmpWatchlist;

        socket.emit("setUserWatchlist", watchlistsArr[room][username]);
    });

    socket.on("getUpcomingDraftPlans", async username => {

        const userUpcomingPlans = upcomingDraftPlansArr[room][username];

        if(isEmpty(userUpcomingPlans) || userUpcomingPlans.length === 0){
            await upcoming(username).then(upcomingPickPlans => {
                //this will now be an array with the all the user's draft plans, not just the 2 coming up
                //on selectPlayer we will continue to iterate through the array
                upcomingDraftPlansArr[room][username] = upcomingPickPlans;
            });
        }

        let count = 0;
        let upcomingPlansStr = '';

        await upcomingDraftPlansArr[room][username].forEach(plan => {
            if(count == 2){
                return upcomingPlansStr;
            }

            if(currentPickArr[room] <= plan.pick){
                upcomingPlansStr += "Pick: " + plan.pick + ": " + plan.position + ", ";
                count++;
            }
        });

        socket.emit("setUpcomingDraftPlans", upcomingPlansStr.slice(0, -2));
    });

    // interval = setInterval(() => {
    //     const response = new Date();
    //     io.emit("timer", response);
    // }, 1000);

    socket.on('getComments', () => {
        io.emit("setComments", commentsArr[room]);
    });

    socket.on('getCurrentPickAndDrafter', () => {
        io.emit('setCurrentPickAndDrafter', currentPickArr[room], currentDrafterArr[room]);
    });

    socket.on('getDraftPicks', () => {
        io.emit('setDraftPicks', draftPicksArr[room]);
    });

    socket.on('getUserRoster', username => {
        if(!isEmpty(rostersArr[room][username])){
            socket.emit('setUserRoster', rostersArr[room][username]);
        }
        else{
            socket.emit('setUserRoster', []);
        }
    });

    socket.on("postComment", (fkUsername, message) => {
        commentsArr[room].push({
            _id: mongoose.Types.ObjectId(),
            fkUsername: fkUsername,
            message: message,
            timestamp: Date.now()
        });
        io.emit("setComments", commentsArr[room]);
    });

    socket.on('updateOnlineUsers', data => {
        onlineUsersStrArr[room] = data.onlineUsers;
        //set for all clients the online users
        io.emit('setOnlineUsers', onlineUsersStrArr[room]);
    });

    socket.on("selectPlayer", async (playerObj) => {
        //check to ensure the username, pick, and fkSkater are correct
        if(currentDrafterArr[room] === playerObj.fkUsername){
            draftPicksArr[room][currentPickArr[room] - 1] = playerObj;
            rostersArr[room][playerObj.fkUsername].push(playerObj);
        }
        else{
            return false;
        }

        currentPickArr[room] = (currentPickArr[room] + 1);
        indexesArr[room] = (indexesArr[room] + 1);

        const newIndex = indexesArr[room];
        const newDrafter = draftOrderArr[room][newIndex].fkUsername;
        currentDrafterArr[room] = newDrafter;

        await io.emit('setCurrentPickAndDrafter', currentPickArr[room], newDrafter);
        await io.emit('setDraftPicks', draftPicksArr[room]);
    });

    socket.on("disconnect", () => {
        console.log("disconnected client " + room);
        // fs.appendFile('server/files/test.txt', 'Contest test @ ' + Date.now(), (err) => {
        //     if(err){
        //         return console.log("ERROR: " + err);
        //     }
        //     return console.log("saved!");
        // });
        clearInterval(interval);
    });
});

server.listen(PORT, () => {
    console.log('listening on port: ', PORT);
});