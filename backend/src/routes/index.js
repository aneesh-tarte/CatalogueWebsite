const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const catalogRoutes = require('./catalogRoutes');
const newsRoutes = require('./newsRoutes');
const libraryRoutes = require('./libraryRoutes');

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/news', newsRoutes);
router.use('/library', libraryRoutes);

module.exports = router;
