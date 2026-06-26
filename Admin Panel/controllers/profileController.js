const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const deleteImage = require('../utils/imageDelete');

exports.getProfile = (req, res) => {
  res.render('profile/view', { title: 'My Profile' });
};

exports.getEditProfile = (req, res) => {
  res.render('profile/edit', { title: 'Edit Profile' });
};

exports.postEditProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.user._id);

    if (email !== admin.email) {
      const existing = await Admin.findOne({ email: email.toLowerCase() });
      if (existing) {
        req.flash('error', 'That email is already in use.');
        return res.redirect('/profile/edit');
      }
    }

    admin.name = name.trim();
    admin.email = email.toLowerCase().trim();

    if (req.file) {
      if (admin.profilePhoto) deleteImage(admin.profilePhoto);
      admin.profilePhoto = req.file.filename;
    }

    await admin.save({ validateBeforeSave: false });
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', 'Failed to update profile.');
    res.redirect('/profile/edit');
  }
};

exports.getChangePassword = (req, res) => {
  res.render('profile/change-password', { title: 'Change Password' });
};

exports.postChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile/change-password');
    }

    if (newPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/profile/change-password');
    }

    const admin = await Admin.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, admin.password);

    if (!isMatch) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/profile/change-password');
    }

    admin.password = newPassword;
    await admin.save();
    req.flash('success', 'Password changed successfully!');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', 'Failed to change password.');
    res.redirect('/profile/change-password');
  }
};
