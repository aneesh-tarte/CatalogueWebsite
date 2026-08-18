const express = require('express');
const { search, getReviews, createComment, getComments } = require('../controllers/catalogController');
const { searchLimiter } = require('../middlewares/rateLimitMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * /api/catalog/search:
 *   get:
 *     summary: Search the global catalog
 *     description: Queries Jikan and IGDB APIs (backed by Redis cache) to find matching media items.
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The search term
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                   example: cache
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       coverImageUrl:
 *                         type: string
 *       400:
 *         description: Missing query parameter
 */
router.get('/search', searchLimiter, search);
router.get('/:id/reviews', getReviews);
router.get('/:id/comments', getComments);
router.post('/:id/comments', authMiddleware, createComment);

module.exports = router;
