const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/multer');

router.get('/', isAuthenticated, subcategoryController.index);
router.get('/add', isAuthenticated, subcategoryController.getAdd);
router.post('/add', isAuthenticated, uploadSingle('image'), subcategoryController.postAdd);
router.get('/edit/:id', isAuthenticated, subcategoryController.getEdit);
router.post('/edit/:id', isAuthenticated, uploadSingle('image'), subcategoryController.postEdit);
router.post('/delete/:id', isAuthenticated, subcategoryController.delete);
router.post('/toggle-status/:id', isAuthenticated, subcategoryController.toggleStatus);
router.get('/by-category/:categoryId', isAuthenticated, subcategoryController.getByCategory);

module.exports = router;
