const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
const helmet = require('helmet');
require("dotenv").config();
 
// Routes
const AuthRoutes = require("./routes/Auth");
const SearchRoutes = require("./routes/Search");

const app = express();
const port = process.env.PORT || 8000;

// CORS middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log('Request origin:', origin);
    
    // Allow specific origins
    const allowedOrigins = [
        'http://localhost:3000', 
    ]; 

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    // Essential CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
 
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://bestingems-admin.azurewebsites.net',
            'https://bestingems-admin-backend.azurewebsites.net',
            'https://bestingems-content-frontend.azurewebsites.net',
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json({limit:"50mb"})); 
app.use(express.urlencoded({ extended: true }));

// Performance Middlewares
app.use(helmet()); // Security headers
app.use(compression()); // Response compression

// MongoDB Connection Implemented with optimized settings
const mongoConnection = mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Set a timeout for the MongoDB connection
setTimeout(() => {
    if (mongoose.connection.readyState !== 1) { // 1 means connected
        console.error('MongoDB connection is taking too long.');
    }
}, 30000); // 30 seconds timeout

mongoose.connection.on('connected', () => {
    console.log('Connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.log('Error connecting to DB', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from DB');
});

// API Routes
app.get("/", (req, res) => {
    res.status(200).send("Server Running Successfully on Azure Portal through github actions! (make it fast deploy) - v3.0");
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.use("/api/auth", AuthRoutes);

app.use("/api/search", SearchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        console.error('CORS Error:', err.message, 'Origin:', req.headers.origin);
        res.status(403).json({ error: 'CORS not allowed' });
    } else {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Keep-alive settings
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 125000; // Make it slightly larger than keepAliveTimeout

// Handle graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server is gracefully shutting down');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});
