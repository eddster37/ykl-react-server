const express = require('express');
const router = express.Router();
const { 
    getComments,
    getOnlineUsers,
    getPicks,
    getUserRoster,
    selectPlayer,
    postComment
} = require('../controllers/controller_draft');

router.get('/comments', getComments);
router.get('/onlineusers', getOnlineUsers);
router.get('/picks', getPicks);

router.post('/roster', getUserRoster);
router.post('/select', selectPlayer);
router.post('/comment', postComment);

module.exports = router;