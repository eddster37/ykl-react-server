const express = require('express');
const router = express.Router();
const { login, getAllUsers } = require('../controllers/controller_users');

router.post('/login', login);
router.get('/all', getAllUsers);

module.exports = router;