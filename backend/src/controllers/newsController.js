const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

const getNews = async (req, res) => {
  try {
    console.log(`[GET] /api/news`);
    const news = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50
    });
    res.json({ data: news });
  } catch (error) {
    console.error('News feed error:', error.stack);
    console.error("Route /api/news Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getNews };
