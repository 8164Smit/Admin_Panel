const Category = require('../models/Category');
const Activity = require('../models/Activity');
const generateSlug = require('../utils/slugGenerator');
const deleteImage = require('../utils/imageDelete');

const ITEMS_PER_PAGE = 10;

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const sort = req.query.sort || 'newest';
    const status = req.query.status || '';

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status) query.status = status;

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      az: { name: 1 },
      za: { name: -1 }
    };

    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const categories = await Category.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('category/index', {
      title: 'Categories',
      categories,
      currentPage: page,
      totalPages,
      search,
      sort,
      status,
      total
    });
  } catch (err) {
    req.flash('error', 'Failed to load categories.');
    res.redirect('/dashboard');
  }
};

exports.getAdd = (req, res) => {
  res.render('category/add', { title: 'Add Category' });
};

exports.postAdd = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      req.flash('error', 'Category name is required.');
      return res.redirect('/category/add');
    }

    const slug = await generateSlug(Category, name);
    const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      req.flash('error', 'A category with this name already exists.');
      return res.redirect('/category/add');
    }

    const image = req.file ? req.file.filename : null;

    const category = await Category.create({ name: name.trim(), slug, description, status: status || 'active', image });

    await Activity.create({
      action: 'Created',
      entity: 'Category',
      entityName: category.name,
      admin: req.user._id,
      icon: 'bi-tag',
      color: 'success'
    });

    req.flash('success', `Category "${category.name}" created successfully!`);
    res.redirect('/category');
  } catch (err) {
    req.flash('error', 'Failed to create category.');
    res.redirect('/category/add');
  }
};

exports.getEdit = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/category');
    }
    res.render('category/edit', { title: 'Edit Category', category });
  } catch (err) {
    req.flash('error', 'Failed to load category.');
    res.redirect('/category');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/category');
    }

    if (!name || !name.trim()) {
      req.flash('error', 'Category name is required.');
      return res.redirect(`/category/edit/${req.params.id}`);
    }

    const duplicate = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      req.flash('error', 'Another category with this name already exists.');
      return res.redirect(`/category/edit/${req.params.id}`);
    }

    category.name = name.trim();
    category.slug = await generateSlug(Category, name, req.params.id);
    category.description = description;
    category.status = status || 'active';

    if (req.file) {
      if (category.image) deleteImage(category.image);
      category.image = req.file.filename;
    }

    await category.save();

    await Activity.create({
      action: 'Updated',
      entity: 'Category',
      entityName: category.name,
      admin: req.user._id,
      icon: 'bi-pencil-square',
      color: 'warning'
    });

    req.flash('success', `Category "${category.name}" updated successfully!`);
    res.redirect('/category');
  } catch (err) {
    req.flash('error', 'Failed to update category.');
    res.redirect('/category');
  }
};

exports.delete = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/category');
    }
    if (category.image) deleteImage(category.image);

    await Activity.create({
      action: 'Deleted',
      entity: 'Category',
      entityName: category.name,
      admin: req.user._id,
      icon: 'bi-trash',
      color: 'danger'
    });

    await category.deleteOne();
    req.flash('success', `Category "${category.name}" deleted successfully!`);
    res.redirect('/category');
  } catch (err) {
    req.flash('error', 'Failed to delete category.');
    res.redirect('/category');
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();
    res.json({ success: true, status: category.status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
