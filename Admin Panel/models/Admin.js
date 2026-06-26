const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  role: {
    type: String,
    default: 'admin'
  },
  resetOTP: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  }
}, { timestamps: true });

AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('Admin', AdminSchema);
