const productNested = require("../models/productNested");

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
        res.status(200).json({ message: "Search successful",count: result.length, data: result });
    } catch (err) {
        console.error("Error during search:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.SearchSuggestion = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const suggestions = await productNested.aggregate([
      {
        $search: {
          index: "ringSearch", // Your MongoDB Atlas search index
          autocomplete: {
            query: query,
            path: "prodName",
            fuzzy: {
              maxEdits: 2, // Allow typo correction
              prefixLength: 1,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          prodName: 1, // Extract product names
        },
      },
    ]);

    // Stopwords (common words that should NOT be considered)
    const stopwords = new Set([
      "14K",
      "WHITE",
      "GOLD",
      "AND",
      "SEMI",
      "MOUNT",
      "RS",
      "MM",
      "ROUND",
      "WITH",
      "IN",
      "PUSH",
      "BACKS",
      "YELLOW",
      "SETTING",
      "STONE",
      "CARAT",
      "OVAL",
      "XMM",
      "DUAL",
      "ROSE",
      "HALO",
      "EARRINGS",
      "PENDANT",
    ]);

    // Extract meaningful words dynamically from `prodName`
    const categorySet = new Set();
    suggestions.forEach((item) => {
      const words = item.prodName
        .replace(/[^a-zA-Z\s]/g, "") // Remove special characters
        .split(/\s+/); // Split by spaces

      words.forEach((word) => {
        const normalizedWord = word.trim().toLowerCase();
        if (
          normalizedWord.length > 2 &&
          !stopwords.has(normalizedWord.toUpperCase())
        ) {
          categorySet.add(
            normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1)
          ); // Capitalize first letter
        }
      });
    });

    // Find the most relevant suggestion (single best match)
    const bestMatch = Array.from(categorySet).find((word) =>
      word.toLowerCase().startsWith(query.toLowerCase())
    );

    res.status(200).json({
      message: "Search suggestions fetched successfully",
      suggestions: bestMatch ? [bestMatch] : [], // Return only the best match
    });
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};





