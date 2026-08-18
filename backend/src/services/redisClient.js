const redis = require('redis');

// Local Dev Note: Make sure your local Redis server is running (e.g., via Docker or native install) to test this caching layer!
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
    console.warn('Redis Client Error:', err.message);
    // Graceful fallback: Application will log but not crash if Redis is down
});

client.connect().catch(err => {
    console.warn('Failed to establish initial Redis connection. Caching will be gracefully bypassed.', err.message);
});

module.exports = client;
