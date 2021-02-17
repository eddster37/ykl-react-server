const express = require('express');
const router = express.Router();
const { draftPlans, upcoming, update } = require('../controllers/controller_draftplans');

router.get('', draftPlans);
router.get('/upcoming', upcoming);
router.post('/update', update);

module.exports = router;