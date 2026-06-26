const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/auth');

router.get('/login', isGuest, authController.getLogin);
router.post('/login', isGuest, authController.postLogin);
router.get('/logout', authController.logout);
router.get('/forgot-password', isGuest, authController.getForgotPassword);
router.post('/forgot-password', isGuest, authController.postForgotPassword);
router.get('/verify-otp', authController.getVerifyOTP);
router.post('/verify-otp', authController.postVerifyOTP);
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;
