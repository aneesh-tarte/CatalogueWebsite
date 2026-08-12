const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
