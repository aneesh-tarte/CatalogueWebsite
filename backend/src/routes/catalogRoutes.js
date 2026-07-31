const express = require('express');
const { search } = require('../controllers/catalogController');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');
const router = express.Router();

router.get('/search', searchLimiter, search);

module.exports = router;
