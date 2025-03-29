const mongoose = require('mongoose');

const productNestedSchema = mongoose.Schema({}, { timestamps: true, collection: 'productNested' });

module.exports = mongoose.model('ProductNested', productNestedSchema);