const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/multer');

router.get('/', isAuthenticated, categoryController.index);
router.get('/add', isAuthenticated, categoryController.getAdd);
router.post('/add', isAuthenticated, uploadSingle('image'), categoryController.postAdd);
router.get('/edit/:id', isAuthenticated, categoryController.getEdit);
router.post('/edit/:id', isAuthenticated, uploadSingle('image'), categoryController.postEdit);
router.post('/delete/:id', isAuthenticated, categoryController.delete);
router.post('/toggle-status/:id', isAuthenticated, categoryController.toggleStatus);

module.exports = router;
