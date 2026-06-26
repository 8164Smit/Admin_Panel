const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/multer');

router.get('/', isAuthenticated, profileController.getProfile);
router.get('/edit', isAuthenticated, profileController.getEditProfile);
router.post('/edit', isAuthenticated, uploadSingle('profilePhoto'), profileController.postEditProfile);
router.get('/change-password', isAuthenticated, profileController.getChangePassword);
router.post('/change-password', isAuthenticated, profileController.postChangePassword);

module.exports = router;
