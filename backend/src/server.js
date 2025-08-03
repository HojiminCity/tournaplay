require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const teamRoutes = require('./routes/teamRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log('Request Body:', req.body);
  next();
});

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(MONGO_URL)
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch(err => console.error('Could not conect to MongoDB...', err));

// Routes
app.get('/', (req, res) => {
    res.send('<h1>MERN Docker Backend</h1><p>API is running...</p>');
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});