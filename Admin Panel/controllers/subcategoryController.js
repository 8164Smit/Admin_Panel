const Subcategory = require('../models/Subcategory');
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
    const categoryFilter = req.query.category || '';

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status) query.status = status;
    if (categoryFilter) query.category = categoryFilter;

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      az: { name: 1 },
      za: { name: -1 }
    };

    const total = await Subcategory.countDocuments(query);
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const subcategories = await Subcategory.find(query)
      .populate('category', 'name')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });

    res.render('subcategory/index', {
      title: 'Subcategories',
      subcategories,
      categories,
      currentPage: page,
      totalPages,
      search,
      sort,
      status,
      categoryFilter,
      total
    });
  } catch (err) {
    req.flash('error', 'Failed to load subcategories.');
    res.redirect('/dashboard');
  }
};

exports.getAdd = async (req, res) => {
  const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
  res.render('subcategory/add', { title: 'Add Subcategory', categories });
};

exports.postAdd = async (req, res) => {
  try {
    const { category, name, description, status } = req.body;

    if (!name || !name.trim() || !category) {
      req.flash('error', 'Category and name are required.');
      return res.redirect('/subcategory/add');
    }

    const existing = await Subcategory.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      category
    });
    if (existing) {
      req.flash('error', 'A subcategory with this name already exists in that category.');
      return res.redirect('/subcategory/add');
    }

    const slug = await generateSlug(Subcategory, name);
    const image = req.file ? req.file.filename : null;

    const sub = await Subcategory.create({ category, name: name.trim(), slug, description, status: status || 'active', image });

    await Activity.create({
      action: 'Created',
      entity: 'Subcategory',
      entityName: sub.name,
      admin: req.user._id,
      icon: 'bi-tags',
      color: 'success'
    });

    req.flash('success', `Subcategory "${sub.name}" created successfully!`);
    res.redirect('/subcategory');
  } catch (err) {
    req.flash('error', 'Failed to create subcategory.');
    res.redirect('/subcategory/add');
  }
};

exports.getEdit = async (req, res) => {
  try {
    const sub = await Subcategory.findById(req.params.id);
    if (!sub) {
      req.flash('error', 'Subcategory not found.');
      return res.redirect('/subcategory');
    }
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.render('subcategory/edit', { title: 'Edit Subcategory', sub, categories });
  } catch (err) {
    req.flash('error', 'Failed to load subcategory.');
    res.redirect('/subcategory');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const { category, name, description, status } = req.body;
    const sub = await Subcategory.findById(req.params.id);
    if (!sub) {
      req.flash('error', 'Subcategory not found.');
      return res.redirect('/subcategory');
    }

    const duplicate = await Subcategory.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      category,
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      req.flash('error', 'Another subcategory with this name already exists in that category.');
      return res.redirect(`/subcategory/edit/${req.params.id}`);
    }

    sub.category = category;
    sub.name = name.trim();
    sub.slug = await generateSlug(Subcategory, name, req.params.id);
    sub.description = description;
    sub.status = status || 'active';

    if (req.file) {
      if (sub.image) deleteImage(sub.image);
      sub.image = req.file.filename;
    }

    await sub.save();

    await Activity.create({
      action: 'Updated',
      entity: 'Subcategory',
      entityName: sub.name,
      admin: req.user._id,
      icon: 'bi-pencil-square',
      color: 'warning'
    });

    req.flash('success', `Subcategory "${sub.name}" updated successfully!`);
    res.redirect('/subcategory');
  } catch (err) {
    req.flash('error', 'Failed to update subcategory.');
    res.redirect('/subcategory');
  }
};

exports.delete = async (req, res) => {
  try {
    const sub = await Subcategory.findById(req.params.id);
    if (!sub) {
      req.flash('error', 'Subcategory not found.');
      return res.redirect('/subcategory');
    }
    if (sub.image) deleteImage(sub.image);

    await Activity.create({
      action: 'Deleted',
      entity: 'Subcategory',
      entityName: sub.name,
      admin: req.user._id,
      icon: 'bi-trash',
      color: 'danger'
    });

    await sub.deleteOne();
    req.flash('success', `Subcategory "${sub.name}" deleted successfully!`);
    res.redirect('/subcategory');
  } catch (err) {
    req.flash('error', 'Failed to delete subcategory.');
    res.redirect('/subcategory');
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const sub = await Subcategory.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false });
    sub.status = sub.status === 'active' ? 'inactive' : 'active';
    await sub.save();
    res.json({ success: true, status: sub.status });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ category: req.params.categoryId, status: 'active' }).sort({ name: 1 });
    res.json({ success: true, subcategories });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
