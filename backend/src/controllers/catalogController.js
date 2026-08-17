const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient({});

const search = async (req, res) => {
  try {
    console.log(`[GET] /api/catalog/search - Query: q=${req.query.q}`);
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query (q) is required' });
    }

    const igdbHeaders = {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${process.env.IGDB_TOKEN}`,
      'Accept': 'application/json',
    };

    const [jikanAnimeRes, jikanMangaRes, igdbRes] = await Promise.allSettled([
      axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&sfw=true`, { timeout: 3000 }),
      axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&sfw=true`, { timeout: 3000 }),
      axios.post(
        'https://api.igdb.com/v4/games',
        `fields name, genres.name, cover.url, first_release_date; search "${q}"; where category = (0, 8, 9) & genres != null; limit 20;`,
        { headers: igdbHeaders, timeout: 3000 }
      )
    ]);

    console.log('Jikan Anime Status:', jikanAnimeRes.status);
    console.log('Jikan Manga Status:', jikanMangaRes.status);
    console.log('IGDB Status:', igdbRes.status);
    if (igdbRes.status === 'rejected') {
      console.log('IGDB Reject Reason:', igdbRes.reason.message, igdbRes.reason.response?.data);
    }

    let combinedResults = [];

    // Process Jikan Anime
    if (jikanAnimeRes.status === 'fulfilled' && jikanAnimeRes.value.data && jikanAnimeRes.value.data.data) {
      const animeItems = jikanAnimeRes.value.data.data.map(item => ({
        externalId: String(item.mal_id),
        title: item.title,
        type: 'ANIME',
        releaseDate: item.aired?.from ? new Date(item.aired.from).toISOString() : null,
        coverImageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
        genres: [...(item.genres || []), ...(item.explicit_genres || []), ...(item.themes || []), ...(item.demographics || [])].map(g => g.name)
      }));
      combinedResults.push(...animeItems);
    }

    // Process Jikan Manga
    if (jikanMangaRes.status === 'fulfilled' && jikanMangaRes.value.data && jikanMangaRes.value.data.data) {
      const mangaItems = jikanMangaRes.value.data.data.map(item => ({
        externalId: String(item.mal_id),
        title: item.title,
        type: 'MANGA',
        releaseDate: item.published?.from ? new Date(item.published.from).toISOString() : null,
        coverImageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
        genres: [...(item.genres || []), ...(item.explicit_genres || []), ...(item.themes || []), ...(item.demographics || [])].map(g => g.name)
      }));
      combinedResults.push(...mangaItems);
    }

    // Process IGDB Games
    if (igdbRes.status === 'fulfilled' && igdbRes.value.data) {
      const gameItems = igdbRes.value.data.map(item => ({
        externalId: String(item.id),
        title: item.name,
        type: 'GAME',
        releaseDate: item.first_release_date ? new Date(item.first_release_date * 1000).toISOString() : null,
        coverImageUrl: item.cover?.url ? item.cover.url.replace('t_thumb', 't_cover_big') : null,
        genres: item.genres ? item.genres.map(g => g.name) : []
      }));
      combinedResults.push(...gameItems);
    }

    // Log the Sanitization
    combinedResults.forEach(item => {
      if (item.type === 'ANIME' || item.type === 'MANGA') {
        console.log('Jikan mapped genres:', item.title, item.genres);
      }
    });

    // Data Sanitization: Filter missing genres and release date
    combinedResults = combinedResults.filter(item => {
      const hasGenres = Array.isArray(item.genres) && item.genres.length > 0;
      const hasReleaseDate = item.releaseDate !== null;
      return hasGenres && hasReleaseDate;
    });

    // Deduplication by title and type (keep longest genres list)
    const uniqueResultsMap = new Map();
    for (const item of combinedResults) {
      const key = `${item.title.toLowerCase()}-${item.type}`;
      if (!uniqueResultsMap.has(key)) {
        uniqueResultsMap.set(key, item);
      } else {
        const existingItem = uniqueResultsMap.get(key);
        if (item.genres.length > existingItem.genres.length) {
          uniqueResultsMap.set(key, item);
        }
      }
    }

    const finalResults = Array.from(uniqueResultsMap.values()).slice(0, 30);

    // Save to DB to generate UUIDs for the frontend
    const savedResults = await Promise.all(finalResults.map(async (item) => {
      try {
        const existingItem = await prisma.mediaItem.findFirst({
          where: { externalId: item.externalId, type: item.type }
        });
        if (existingItem) {
          return await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data: {
              title: item.title,
              genres: item.genres,
              coverImageUrl: item.coverImageUrl,
              releaseDate: item.releaseDate
            }
          });
        } else {
          return await prisma.mediaItem.create({
            data: {
              externalId: item.externalId,
              type: item.type,
              title: item.title,
              genres: item.genres,
              coverImageUrl: item.coverImageUrl,
              releaseDate: item.releaseDate
            }
          });
        }
      } catch (e) {
        console.error('Failed to save item:', e);
        return null;
      }
    }));

    const validSavedResults = savedResults.filter(r => r !== null);

    res.json({ 
      source: 'api', 
      data: validSavedResults,
      debug_jikan_anime: jikanAnimeRes.status,
      debug_jikan_manga: jikanMangaRes.status,
      debug_igdb: igdbRes.status,
      debug_igdb_reason: igdbRes.status === 'rejected' ? igdbRes.reason.message : null
    });
  } catch (error) {
    console.error('Catalog search error:', error.stack);
    res.json({ source: 'api', data: [], debug_error: error.message, debug_stack: error.stack });
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
