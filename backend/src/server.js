require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch(err => console.error('Could not conect to MongoDB...', err));

app.get('/', (req, res) => {
    res.send('<h1>MERN Docker Backend</h1><p>API is running...</p>');
});

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});