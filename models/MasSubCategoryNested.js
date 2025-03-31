const mongoose = require('mongoose');

const masSubCategoryNested = mongoose.Schema({}, { timestamps: true, collection: 'masSubCategoryNested' });

module.exports = mongoose.model('MasSubCategoryNested', masSubCategoryNested);