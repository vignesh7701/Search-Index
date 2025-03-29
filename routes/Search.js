const express = require('express');
const router = express.Router();
const searchController = require('../controllers/Search');

// Route to verify token
router.get('/search', searchController.Search);

router.get('/suggestion', searchController.SearchSuggestion);


module.exports = router;