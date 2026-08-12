require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const NewsSyncJob = require('./services/NewsSyncJob');

const app = express();

app.use(cors({
    origin: [
        'https://catalogue-website-frontend.vercel.app', 
        'https://catalogue-website-ten.vercel.app',
        'http://localhost:3000', 
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', routes);

NewsSyncJob.start();

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server listening on port 3000'));
}
module.exports = app;
