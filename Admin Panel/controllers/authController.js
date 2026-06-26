const passport = require('passport');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const generateOTP = require('../utils/otpGenerator');
const { sendOTPEmail } = require('../utils/mailUtility');

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Admin Login', layout: false });
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, admin, info) => {
    if (err) return next(err);
    if (!admin) {
      req.flash('error', info.message || 'Login failed.');
      return res.redirect('/auth/login');
    }
    req.logIn(admin, (err) => {
      if (err) return next(err);
      req.flash('success', `Welcome back, ${admin.name}!`);
      res.redirect('/dashboard');
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been logged out.');
    res.redirect('/auth/login');
  });
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password', layout: false });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      req.flash('error', 'No account found with that email address.');
      return res.redirect('/auth/forgot-password');
    }
    const { otp, expiry } = generateOTP();
    admin.resetOTP = otp;
    admin.otpExpiry = expiry;
    await admin.save({ validateBeforeSave: false });
    await sendOTPEmail(admin.email, otp, admin.name);
    req.session.resetEmail = admin.email;
    req.flash('success', `OTP sent to ${admin.email}. Valid for 10 minutes.`);
    res.redirect('/auth/verify-otp');
  } catch (err) {
    req.flash('error', 'Failed to send OTP. Check SMTP settings.');
    res.redirect('/auth/forgot-password');
  }
};

exports.getVerifyOTP = (req, res) => {
  if (!req.session.resetEmail) return res.redirect('/auth/forgot-password');
  res.render('auth/verify-otp', { title: 'Verify OTP', layout: false });
};

exports.postVerifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.resetEmail;
    if (!email) return res.redirect('/auth/forgot-password');
    const admin = await Admin.findOne({ email });
    if (!admin || admin.resetOTP !== otp) {
      req.flash('error', 'Invalid OTP. Please try again.');
      return res.redirect('/auth/verify-otp');
    }
    if (admin.otpExpiry < Date.now()) {
      req.flash('error', 'OTP has expired. Please request a new one.');
      return res.redirect('/auth/forgot-password');
    }
    req.session.otpVerified = true;
    req.flash('success', 'OTP verified! Set your new password.');
    res.redirect('/auth/reset-password');
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/auth/verify-otp');
  }
};

exports.getResetPassword = (req, res) => {
  if (!req.session.resetEmail || !req.session.otpVerified) return res.redirect('/auth/forgot-password');
  res.render('auth/reset-password', { title: 'Reset Password', layout: false });
};

exports.postResetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/reset-password');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/auth/reset-password');
    }
    const email = req.session.resetEmail;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.redirect('/auth/forgot-password');
    admin.password = password;
    admin.resetOTP = null;
    admin.otpExpiry = null;
    await admin.save();
    req.session.resetEmail = null;
    req.session.otpVerified = null;
    req.flash('success', 'Password reset successfully! Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error', 'Failed to reset password.');
    res.redirect('/auth/reset-password');
  }
};
