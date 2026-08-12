const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMessages = async (req, res) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50
        });
        // Reverse to return them in chronological order
        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('getMessages error:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const postMessage = async (req, res) => {
    try {
        const { username, content } = req.body;
        
        if (!username || !content) {
            return res.status(400).json({ error: 'Username and content are required' });
        }

        const newMessage = await prisma.chatMessage.create({
            data: {
                username,
                content
            }
        });

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error('postMessage error:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getMessages, postMessage };
