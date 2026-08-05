const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

const getLibrary = async (req, res) => {
  try {
    console.log(`[GET] /api/library`);
    const { userId } = req.user;
    const library = await prisma.userLibrary.findMany({
      where: { userId },
      include: { mediaItem: true }
    });
    res.json({ library });
  } catch (error) {
    console.error('Library get error:', error.stack);
    console.error("Route /api/library Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateLibrary = async (req, res) => {
  try {
    console.log(`[POST/PUT/PATCH] /api/library/update - Body:`, req.body);
    const { userId } = req.user;
    const { mediaItemId, status, currentProgress, personalScore, reviewText } = req.body;

    if (!mediaItemId || !status) {
      return res.status(400).json({ error: 'mediaItemId and status are required' });
    }

    const libraryEntry = await prisma.userLibrary.upsert({
      where: {
        userId_mediaItemId: {
          userId,
          mediaItemId
        }
      },
      update: {
        status,
        currentProgress: currentProgress !== undefined ? currentProgress : undefined,
        personalScore: personalScore !== undefined ? personalScore : undefined,
        reviewText: reviewText !== undefined ? reviewText : undefined
      },
      create: {
        userId,
        mediaItemId,
        status,
        currentProgress: currentProgress || 0,
        personalScore,
        reviewText
      }
    });

    res.json({ data: libraryEntry });
  } catch (error) {
    console.error('Library update error:', error.stack);
    console.error("Route /api/library/update Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteLibraryItem = async (req, res) => {
  try {
    console.log(`[DELETE] /api/library/${req.params.id}`);
    const { userId } = req.user;
    const { id } = req.params;
    await prisma.userLibrary.deleteMany({
      where: { id: id, userId: userId }
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Library delete error:', error.stack);
    console.error("Route /api/library/:id Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addLibraryItem = async (req, res) => {
  try {
    console.log(`[POST] /api/library - Body:`, req.body);
    const { userId } = req.user;
    const { apiId, title, type, imageUrl } = req.body;

    if (!apiId || !title || !type) {
      return res.status(400).json({ error: 'apiId, title, and type are required' });
    }

    let mediaItem = await prisma.mediaItem.findFirst({
      where: { externalId: String(apiId), type }
    });

    if (!mediaItem) {
      mediaItem = await prisma.mediaItem.create({
        data: {
          externalId: String(apiId),
          type,
          title,
          coverImageUrl: imageUrl || null
        }
      });
    }

    const libraryEntry = await prisma.userLibrary.upsert({
      where: {
        userId_mediaItemId: {
          userId,
          mediaItemId: mediaItem.id
        }
      },
      update: {},
      create: {
        userId,
        mediaItemId: mediaItem.id,
        status: 'PLAN_TO_TRACK'
      }
    });

    res.status(200).json({ data: libraryEntry });
  } catch (error) {
    console.error('Library add error:', error.stack);
    console.error("Route /api/library Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getLibrary, updateLibrary, deleteLibraryItem, addLibraryItem };
