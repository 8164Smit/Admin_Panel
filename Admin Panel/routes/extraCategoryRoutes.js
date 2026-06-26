const express = require('express');
const router = express.Router();
const extraCategoryController = require('../controllers/extraCategoryController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/multer');

router.get('/', isAuthenticated, extraCategoryController.index);
router.get('/add', isAuthenticated, extraCategoryController.getAdd);
router.post('/add', isAuthenticated, uploadSingle('image'), extraCategoryController.postAdd);
router.get('/edit/:id', isAuthenticated, extraCategoryController.getEdit);
router.post('/edit/:id', isAuthenticated, uploadSingle('image'), extraCategoryController.postEdit);
router.post('/delete/:id', isAuthenticated, extraCategoryController.delete);
router.post('/toggle-status/:id', isAuthenticated, extraCategoryController.toggleStatus);
router.get('/by-subcategory/:subcategoryId', isAuthenticated, extraCategoryController.getBySubcategory);

module.exports = router;
