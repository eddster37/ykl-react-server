const express = require('express');
const router = express.Router();
const { getDraftYears } = require('../controllers/controller_draft_years');

router.get('', getDraftYears);

module.exports = router;