require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const exists = await Admin.findOne({ email: 'admin@adminpanel.com' });
    if (exists) {
      console.log('Admin already exists. Email: admin@adminpanel.com');
      process.exit(0);
    }

    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@adminpanel.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email:    admin@adminpanel.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Change this password immediately after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
