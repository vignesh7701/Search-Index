const productNested = require("../models/productNested");
const masSubCategoryNested = require("../models/MasSubCategoryNested");
const categoryNested = require("../models/CategoryNested");

exports.Search = async (req, res) => {
  try {
    const { query } = req.query; // Get search query
    if (!query) return res.status(400).json({ message: "Query is required" });

    const result = await productNested.aggregate([
      {
        $search: {
          index: "ringSearch", // Replace with your actual index name
          compound: {
            should: [
              {
                autocomplete: {
                  query: query,
                  path: "prodName",
                  tokenOrder: "sequential",
                  fuzzy: {
                    maxEdits: 2, // Allows spelling corrections (e.g., "dimond" → "diamond")
                    prefixLength: 1,
                  },
                },
              },
              {
                text: {
                  query: query,
                  path: "prodName",
                  score: { boost: { value: 5 } }, // Prioritize exact matches
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          prodName: 1,
        },
      },
    ]);

    console.log("Search Results:", result);
    res
      .status(200)
      .json({
        message: "Search successful",
        count: result.length,
        data: result,
      });
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.SearchSuggestion = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query is required" });

    let categorySet = new Set();
    let productSuggestions = [];

    // Fetch gemstone and subcategory names
    const gsData = await masSubCategoryNested.find(
      {},
      { _id: 0, gsName: 1, SubCatgryName: 1 }
    );

    gsData.forEach((item) => {
      if (item.gsName && typeof item.gsName === "string") {
        categorySet.add(item.gsName.trim().toLowerCase());
      }
      if (item.SubCatgryName && typeof item.SubCatgryName === "string") {
        categorySet.add(item.SubCatgryName.trim().toLowerCase());
      }
    });

    // Fetch related product-based search suggestions
    const productResults = await productNested.aggregate([
      {
        $search: {
          index: "ringSearch",
          autocomplete: {
            query: query,
            path: "prodName",
            fuzzy: {
              maxEdits: 2,
              prefixLength: 1,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          prodName: 1, 
        },
      },
       
    ]);

    // Process product names
    productResults.forEach((item) => {
      if (item.prodName && typeof item.prodName === "string") {
        let cleanName = item.prodName
          .replace(/\([\w\d-]+\)/g, "") // Remove product codes like (PS231)
          .replace(/\b\d+(\.\d+)?(mm|x|X)?\b/g, "") // Remove sizes (e.g., "14MM", "8x6MM")
          .replace(/[^a-zA-Z\s]/g, "") // Remove non-alphabetic characters
          .trim();

        const words = cleanName
          .split(/\s+/) // Split words
          .map((word) => word.trim().toLowerCase()) // Normalize case
          .filter((word) => word.length > 2); // Remove short words

        words.forEach((word) => {
          categorySet.add(word);
        });

        // Store product details for frontend display
        productSuggestions.push({
          id: item._id,
          name: item.prodName,
          image: item.image || "", // Default empty string if no image
          price: item.price || "", // Default empty string if no price
        });
      }
    });

    // Filter only relevant words
    const matchedCategories = Array.from(categorySet)
      .filter((word) => word.length > 2) // Ignore very short words
      .filter((word) => /^[a-zA-Z]+$/.test(word)) // Only allow alphabetic words
      .filter((word) => word.startsWith(query.toLowerCase())) // Match query prefix
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    // If no valid suggestion, return empty array instead of gibberish
    res.status(200).json({
      message: "Search suggestions fetched successfully",
      categories: matchedCategories.length ? matchedCategories : [],
      relatedProducts: productSuggestions, // Send related product suggestions
    });
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

