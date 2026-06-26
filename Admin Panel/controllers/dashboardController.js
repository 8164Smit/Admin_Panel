const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ExtraCategory = require('../models/ExtraCategory');
const Product = require('../models/Product');
const Activity = require('../models/Activity');

exports.getDashboard = async (req, res) => {
  try {
    const [totalCategories, totalSubcategories, totalExtraCategories, totalProducts] = await Promise.all([
      Category.countDocuments(),
      Subcategory.countDocuments(),
      ExtraCategory.countDocuments(),
      Product.countDocuments()
    ]);

    const recentProducts = await Product.find()
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivities = await Activity.find()
      .populate('admin', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const activeProducts = await Product.countDocuments({ status: 'active' });
    const inactiveProducts = await Product.countDocuments({ status: 'inactive' });
    const activeCategories = await Category.countDocuments({ status: 'active' });

    res.render('dashboard/index', {
      title: 'Dashboard',
      totalCategories,
      totalSubcategories,
      totalExtraCategories,
      totalProducts,
      recentProducts,
      recentActivities,
      activeProducts,
      inactiveProducts,
      activeCategories
    });
  } catch (err) {
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/dashboard');
  }
};
