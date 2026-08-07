const { PrismaClient } = require('@prisma/client');
const IGDBGameService = require('../services/IGDBGameService');
const AniListService = require('../services/AniListService');
const prisma = new PrismaClient({});

const search = async (req, res) => {
  try {
    console.log(`[GET] /api/catalog/search - Query: q=${req.query.q}`);
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query (q) is required' });
    }

    const cachedItemsPromise = prisma.mediaItem.findMany({
      where: {
        title: {
          contains: q,
          mode: 'insensitive'
        }
      },
      take: 10
    });

    const [cachedItems, games, anime, manga] = await Promise.all([
      cachedItemsPromise,
      IGDBGameService.searchGames(q).catch(e => { console.error('IGDB Error:', e); return []; }),
      AniListService.searchMedia(q, 'ANIME').catch(e => { console.error('AniList Anime Error:', e); return []; }),
      AniListService.searchMedia(q, 'MANGA').catch(e => { console.error('AniList Manga Error:', e); return []; })
    ]);

    const combinedResults = [...cachedItems, ...games, ...anime, ...manga];
    const uniqueResultsMap = new Map();
    for (const item of combinedResults) {
      const key = `${item.type}-${item.externalId}`;
      if (!uniqueResultsMap.has(key)) {
        uniqueResultsMap.set(key, item);
      }
    }
    
    const finalResults = Array.from(uniqueResultsMap.values()).slice(0, 20);

    res.json({ source: 'api', data: finalResults });
  } catch (error) {
    console.error('Catalog search error:', error.stack);
    res.json({ source: 'api', data: [] });
  }
};

module.exports = { search };
