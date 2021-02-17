const express = require('express');
const router = express.Router();
const { getUserWatchlist, addToWatchlist, removeFromWatchlist, updateRankings } = require('../controllers/controller_watchlist');

router.get('/user', getUserWatchlist);
router.post('/add', addToWatchlist);
router.post('/remove', removeFromWatchlist);
router.post('/update', updateRankings);

module.exports = router;