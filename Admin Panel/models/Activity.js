const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  entity: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  icon: {
    type: String,
    default: 'bi-activity'
  },
  color: {
    type: String,
    default: 'primary'
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
