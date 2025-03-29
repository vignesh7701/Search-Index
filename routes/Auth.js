const express = require("express");
const router = express.Router();
const authController = require("../controllers/Auth");

// Route to verify token
router.post("/verify-token", authController.VerifyToken);

// Route to hash password
router.post("/hash-password", authController.hashPassword);

// Route for user login
router.post("/login", authController.login);

module.exports = router;
