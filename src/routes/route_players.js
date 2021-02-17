const express = require('express');
const router = express.Router();
const { getPlayerStats, getTeams } = require('../controllers/controller_players');

router.post('/stats', getPlayerStats);
router.get('/teams', getTeams);

module.exports = router;