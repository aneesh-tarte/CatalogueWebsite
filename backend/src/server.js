require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const NewsSyncJob = require('./services/NewsSyncJob');

const app = express();

app.use(cors({
  origin: 'http://localhost:8000', // The port your frontend is running on
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true // Crucial for sending JWT tokens securely
}));
app.use(express.json());
app.use('/api', routes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

NewsSyncJob.start();

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server listening on port 3000'));
}
module.exports = app;
