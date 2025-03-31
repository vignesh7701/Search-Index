const mongoose = require('mongoose');

const categoryNested = mongoose.Schema({}, { timestamps: true, collection: 'categoryNested' });

module.exports = mongoose.model('CategoryNested', categoryNested);