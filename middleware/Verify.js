const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in an environment variable for security)
// const SECRET_KEY = process.env.SECRET_KEY;

// Middleware function for verifying user authentication
const verifyToken = () => {
    return (req, res, next) => {
        // Get the token from the 'Authorization' header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            // Verify the token and decode the payload
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the decoded payload to req.user
            req.user = decoded;
            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: 'Invalid token.' });
            } else {
                return res.status(500).json({ message: 'An error occurred while verifying the token.' });
            }
        }
    };
};

module.exports = verifyToken;
