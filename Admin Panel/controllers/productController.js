const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ExtraCategory = require('../models/ExtraCategory');
const Activity = require('../models/Activity');
const generateSlug = require('../utils/slugGenerator');
const deleteImage = require('../utils/imageDelete');
const path = require('path');

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
      za: { name: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 }
    };

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('extraCategory', 'name')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('product/index', {
      title: 'Products',
      products,
      currentPage: page,
      totalPages,
      search,
      sort,
      status,
      total
    });
  } catch (err) {
    req.flash('error', 'Failed to load products.');
    res.redirect('/dashboard');
  }
};

exports.getAdd = async (req, res) => {
  const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
  res.render('product/add', { title: 'Add Product', categories });
};

exports.postAdd = async (req, res) => {
  try {
    const { category, subcategory, extraCategory, name, brand, sku, price, discount, stock, description, features, status } = req.body;

    if (!name || !name.trim() || !category || !subcategory || !price) {
      req.flash('error', 'Name, category, subcategory, and price are required.');
      return res.redirect('/product/add');
    }

    const existing = await Product.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      req.flash('error', 'A product with this name already exists.');
      return res.redirect('/product/add');
    }

    if (sku) {
      const skuExists = await Product.findOne({ sku: sku.trim() });
      if (skuExists) {
        req.flash('error', 'SKU already in use.');
        return res.redirect('/product/add');
      }
    }

    const slug = await generateSlug(Product, name);
    const mainImage = req.files && req.files['mainImage'] ? req.files['mainImage'][0].filename : null;
    const images = req.files && req.files['images'] ? req.files['images'].map(f => f.filename) : [];

    const product = await Product.create({
      category, subcategory,
      extraCategory: extraCategory || null,
      name: name.trim(), slug, brand, sku: sku || undefined, price, discount: discount || 0,
      stock: stock || 0, description, features,
      mainImage, images,
      status: status || 'active'
    });

    await Activity.create({
      action: 'Created',
      entity: 'Product',
      entityName: product.name,
      admin: req.user._id,
      icon: 'bi-box-seam',
      color: 'success'
    });

    req.flash('success', `Product "${product.name}" created successfully!`);
    res.redirect('/product');
  } catch (err) {
    req.flash('error', `Failed to create product: ${err.message}`);
    res.redirect('/product/add');
  }
};

exports.getEdit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/product');
    }
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    const subcategories = await Subcategory.find({ category: product.category, status: 'active' }).sort({ name: 1 });
    const extraCategories = await ExtraCategory.find({ subcategory: product.subcategory, status: 'active' }).sort({ name: 1 });
    res.render('product/edit', { title: 'Edit Product', product, categories, subcategories, extraCategories });
  } catch (err) {
    req.flash('error', 'Failed to load product.');
    res.redirect('/product');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const { category, subcategory, extraCategory, name, brand, sku, price, discount, stock, description, features, status, deleteImages } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/product');
    }

    product.category = category;
    product.subcategory = subcategory;
    product.extraCategory = extraCategory || null;
    product.name = name.trim();
    product.slug = await generateSlug(Product, name, req.params.id);
    product.brand = brand;
    product.price = price;
    product.discount = discount || 0;
    product.stock = stock || 0;
    product.description = description;
    product.features = features;
    product.status = status || 'active';

    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku: sku.trim(), _id: { $ne: req.params.id } });
      if (skuExists) {
        req.flash('error', 'SKU already in use.');
        return res.redirect(`/product/edit/${req.params.id}`);
      }
      product.sku = sku.trim();
    }

    if (req.files && req.files['mainImage']) {
      if (product.mainImage) deleteImage(product.mainImage);
      product.mainImage = req.files['mainImage'][0].filename;
    }

    if (deleteImages) {
      const toDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
      toDelete.forEach(img => deleteImage(img));
      product.images = product.images.filter(img => !toDelete.includes(img));
    }

    if (req.files && req.files['images']) {
      const newImages = req.files['images'].map(f => f.filename);
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    await Activity.create({
      action: 'Updated',
      entity: 'Product',
      entityName: product.name,
      admin: req.user._id,
      icon: 'bi-pencil-square',
      color: 'warning'
    });

    req.flash('success', `Product "${product.name}" updated successfully!`);
    res.redirect('/product');
  } catch (err) {
    req.flash('error', `Failed to update product: ${err.message}`);
    res.redirect('/product');
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/product');
    }

    if (product.mainImage) deleteImage(product.mainImage);
    product.images.forEach(img => deleteImage(img));

    await Activity.create({
      action: 'Deleted',
      entity: 'Product',
      entityName: product.name,
      admin: req.user._id,
      icon: 'bi-trash',
      color: 'danger'
    });

    await product.deleteOne();
    req.flash('success', `Product "${product.name}" deleted successfully!`);
    res.redirect('/product');
  } catch (err) {
    req.flash('error', 'Failed to delete product.');
    res.redirect('/product');
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false });
    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();
    res.json({ success: true, status: product.status });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
