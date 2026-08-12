require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const NewsSyncJob = require('./services/NewsSyncJob');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'https://catalogue-website-frontend.vercel.app', 
    'https://catalogue-website-ten.vercel.app',
    'http://localhost:3000', 
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', routes);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    socket.join('global-chat');
    
    socket.on('chatMessage', (msg) => {
        io.to('global-chat').emit('chatMessage', {
            username: msg.username || 'Anonymous',
            content: msg.content,
            timestamp: new Date().toISOString()
        });
    });
});

NewsSyncJob.start();

if (process.env.NODE_ENV !== 'production') {
    server.listen(3000, () => console.log('Server listening on port 3000'));
}
module.exports = app;
