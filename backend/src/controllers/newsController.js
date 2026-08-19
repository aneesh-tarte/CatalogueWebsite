const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});
const NewsSyncJob = require('../services/NewsSyncJob');

const getNews = async (req, res) => {
  try {
    console.log(`[GET] /api/news`);
    // Removed await NewsSyncJob.runSync(); to prevent blocking the API with external RSS fetching. 
    // The background cron job in server.js will handle fetching the news hourly.
    const news = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50
    });
    res.json({ data: news });
  } catch (error) {
    console.error('News feed error:', error.stack);
    console.error("Route /api/news Error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

module.exports = { getNews };
