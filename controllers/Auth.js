const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UserDetails = {
    username: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD // This is already hashed in .env
}

exports.VerifyToken = async (req,res)=>{
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = req.headers.authorization.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        
        // Generate new access token
        const newToken = jwt.sign(
            { 
                username: decoded.username,
                email: decoded.email
            },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            message: 'Token is valid',
            access: newToken,
            user: {
                username: decoded.username,
                email: decoded.email
            }
        });

    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Hash password controller
exports.hashPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        res.status(200).json({ hashedPassword });

    } catch (error) {
        res.status(500).json({ message: 'Error hashing password', error: error.message });
    }
};


// User login controller 
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email matches admin email
        if (email !== UserDetails.email) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with hashed password from env
        const isValidPassword = await bcrypt.compare(password, UserDetails.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            { 
                username: UserDetails.username,
                email: UserDetails.email
            },
            process.env.SECRET_KEY,
            { expiresIn: '15m' } // Short expiry for access token
        );

        // Generate refresh token (long-lived)
        const refreshToken = jwt.sign(
            {
                username: UserDetails.username,
                email: UserDetails.email
            },
            process.env.SECRET_KEY, // Using same secret key
            { expiresIn: '7d' } // Longer expiry for refresh token
        );

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                username: UserDetails.username,
                email: UserDetails.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};


