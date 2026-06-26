const ExtraCategory = require('../models/ExtraCategory');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
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

    const total = await ExtraCategory.countDocuments(query);
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const extraCategories = await ExtraCategory.find(query)
      .populate({ path: 'subcategory', populate: { path: 'category', model: 'Category' } })
      .populate('category', 'name')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });

    res.render('extracategory/index', {
      title: 'Extra Categories',
      extraCategories,
      categories,
      currentPage: page,
      totalPages,
      search,
      sort,
      status,
      total
    });
  } catch (err) {
    req.flash('error', 'Failed to load extra categories.');
    res.redirect('/dashboard');
  }
};

exports.getAdd = async (req, res) => {
  const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
  res.render('extracategory/add', { title: 'Add Extra Category', categories });
};

exports.postAdd = async (req, res) => {
  try {
    const { category, subcategory, name, description, status } = req.body;

    if (!name || !name.trim() || !category || !subcategory) {
      req.flash('error', 'Category, subcategory, and name are required.');
      return res.redirect('/extracategory/add');
    }

    const existing = await ExtraCategory.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      subcategory
    });
    if (existing) {
      req.flash('error', 'An extra category with this name already exists in that subcategory.');
      return res.redirect('/extracategory/add');
    }

    const slug = await generateSlug(ExtraCategory, name);
    const image = req.file ? req.file.filename : null;

    const extra = await ExtraCategory.create({ category, subcategory, name: name.trim(), slug, description, status: status || 'active', image });

    await Activity.create({
      action: 'Created',
      entity: 'ExtraCategory',
      entityName: extra.name,
      admin: req.user._id,
      icon: 'bi-diagram-3',
      color: 'success'
    });

    req.flash('success', `Extra Category "${extra.name}" created successfully!`);
    res.redirect('/extracategory');
  } catch (err) {
    req.flash('error', 'Failed to create extra category.');
    res.redirect('/extracategory/add');
  }
};

exports.getEdit = async (req, res) => {
  try {
    const extra = await ExtraCategory.findById(req.params.id);
    if (!extra) {
      req.flash('error', 'Extra category not found.');
      return res.redirect('/extracategory');
    }
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    const subcategories = await Subcategory.find({ category: extra.category, status: 'active' }).sort({ name: 1 });
    res.render('extracategory/edit', { title: 'Edit Extra Category', extra, categories, subcategories });
  } catch (err) {
    req.flash('error', 'Failed to load extra category.');
    res.redirect('/extracategory');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const { category, subcategory, name, description, status } = req.body;
    const extra = await ExtraCategory.findById(req.params.id);
    if (!extra) {
      req.flash('error', 'Extra category not found.');
      return res.redirect('/extracategory');
    }

    const duplicate = await ExtraCategory.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      subcategory,
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      req.flash('error', 'Another extra category with this name already exists.');
      return res.redirect(`/extracategory/edit/${req.params.id}`);
    }

    extra.category = category;
    extra.subcategory = subcategory;
    extra.name = name.trim();
    extra.slug = await generateSlug(ExtraCategory, name, req.params.id);
    extra.description = description;
    extra.status = status || 'active';

    if (req.file) {
      if (extra.image) deleteImage(extra.image);
      extra.image = req.file.filename;
    }

    await extra.save();

    await Activity.create({
      action: 'Updated',
      entity: 'ExtraCategory',
      entityName: extra.name,
      admin: req.user._id,
      icon: 'bi-pencil-square',
      color: 'warning'
    });

    req.flash('success', `Extra Category "${extra.name}" updated successfully!`);
    res.redirect('/extracategory');
  } catch (err) {
    req.flash('error', 'Failed to update extra category.');
    res.redirect('/extracategory');
  }
};

exports.delete = async (req, res) => {
  try {
    const extra = await ExtraCategory.findById(req.params.id);
    if (!extra) {
      req.flash('error', 'Extra category not found.');
      return res.redirect('/extracategory');
    }
    if (extra.image) deleteImage(extra.image);

    await Activity.create({
      action: 'Deleted',
      entity: 'ExtraCategory',
      entityName: extra.name,
      admin: req.user._id,
      icon: 'bi-trash',
      color: 'danger'
    });

    await extra.deleteOne();
    req.flash('success', `Extra Category "${extra.name}" deleted successfully!`);
    res.redirect('/extracategory');
  } catch (err) {
    req.flash('error', 'Failed to delete extra category.');
    res.redirect('/extracategory');
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const extra = await ExtraCategory.findById(req.params.id);
    if (!extra) return res.status(404).json({ success: false });
    extra.status = extra.status === 'active' ? 'inactive' : 'active';
    await extra.save();
    res.json({ success: true, status: extra.status });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getBySubcategory = async (req, res) => {
  try {
    const extras = await ExtraCategory.find({ subcategory: req.params.subcategoryId, status: 'active' }).sort({ name: 1 });
    res.json({ success: true, extras });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
