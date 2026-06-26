const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/multer');

router.get('/', isAuthenticated, productController.index);
router.get('/add', isAuthenticated, productController.getAdd);
router.post('/add', isAuthenticated, uploadMultiple('mainImage', 10), productController.postAdd);
router.get('/edit/:id', isAuthenticated, productController.getEdit);
router.post('/edit/:id', isAuthenticated, uploadMultiple('mainImage', 10), productController.postEdit);
router.post('/delete/:id', isAuthenticated, productController.delete);
router.post('/toggle-status/:id', isAuthenticated, productController.toggleStatus);

module.exports = router;
