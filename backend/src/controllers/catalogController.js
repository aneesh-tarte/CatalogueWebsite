const { PrismaClient } = require('@prisma/client');
const IGDBGameService = require('../services/IGDBGameService');
const AniListService = require('../services/AniListService');
const prisma = new PrismaClient({});

const search = async (req, res) => {
  try {
    console.log(`[GET] /api/catalog/search - Query: q=${req.query.q}, type=${req.query.type}`);
    const { q, type } = req.query;
    if (!q || !type) {
      return res.status(400).json({ error: 'Query (q) and type are required' });
    }

    const cachedItems = await prisma.mediaItem.findMany({
      where: {
        type: type,
        title: {
          contains: q,
          mode: 'insensitive'
        }
      },
      take: 10
    });

    if (cachedItems.length > 0) {
      return res.json({ source: 'cache', data: cachedItems });
    }

    let results = [];
    if (type === 'GAME') {
      results = await IGDBGameService.searchGames(q);
    } else if (type === 'ANIME' || type === 'MANGA') {
      results = await AniListService.searchMedia(q, type);
    }

    res.json({ source: 'api', data: results });
  } catch (error) {
    console.error('Catalog search error:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { search };
