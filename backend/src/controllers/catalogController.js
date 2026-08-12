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

const getReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.userLibrary.findMany({
      where: {
        mediaItemId: id,
        reviewText: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    const aggregations = await prisma.userLibrary.aggregate({
      where: {
        mediaItemId: id,
        personalScore: {
          not: null
        }
      },
      _avg: {
        personalScore: true
      }
    });

    const averageScore = aggregations._avg.personalScore;

    res.json({
      averageScore,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const createComment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        mediaItemId: id,
        parentId: parentId || null
      },
      include: {
        author: {
          select: { email: true }
        }
      }
    });

    res.status(201).json({ data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        mediaItemId: id,
        parentId: null // top-level comments
      },
      include: {
        author: {
          select: { email: true }
        },
        replies: {
          include: {
            author: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

module.exports = { search, getReviews, createComment, getComments };
