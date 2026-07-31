const express = require('express');
const { getLibrary, updateLibrary, deleteLibraryItem, addLibraryItem } = require('../controllers/libraryController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', authMiddleware, getLibrary);
router.post('/', authMiddleware, addLibraryItem);
router.post('/update', authMiddleware, updateLibrary);
router.put('/update', authMiddleware, updateLibrary);
router.patch('/update', authMiddleware, updateLibrary);
router.delete('/:id', authMiddleware, deleteLibraryItem);

module.exports = router;
