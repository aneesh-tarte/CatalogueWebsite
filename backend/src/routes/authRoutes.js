const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', authLimiter, register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Logs in a user using email and password, returning a JWT token and username.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mysecurepassword
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 username:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, login);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
