const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: true
  },
  extraCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExtraCategory',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  features: {
    type: String,
    trim: true,
    default: ''
  },
  mainImage: {
    type: String,
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
