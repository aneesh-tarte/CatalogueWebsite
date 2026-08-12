const express = require('express');
const { search, getReviews, createComment, getComments } = require('../controllers/catalogController');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/search', searchLimiter, search);
router.get('/:id/reviews', getReviews);
router.get('/:id/comments', getComments);
router.post('/:id/comments', authMiddleware, createComment);

module.exports = router;
