const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({});
const ANILIST_API_URL = 'https://graphql.anilist.co';

class AniListService {
  static async makeRequest(query, variables) {
    try {
      const response = await axios.post(ANILIST_API_URL, {
        query,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error in AniListService.makeRequest:', error.message);
      throw error;
    }
  }

  static async searchMedia(search, type = 'ANIME') {
    const query = `
      query ($search: String, $type: MediaType) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: $type) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            startDate {
              year
              month
              day
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { search, type });
      const results = [];
      
      for (const item of data.Page.media) {
        const title = item.title.english || item.title.romaji;
        let releaseDate = null;
        if (item.startDate && item.startDate.year) {
          releaseDate = new Date(item.startDate.year, (item.startDate.month || 1) - 1, item.startDate.day || 1);
        }

        const existingItem = await prisma.mediaItem.findFirst({
          where: { externalId: String(item.id), type }
        });

        const updateData = {
          title,
          synopsis: item.description,
          coverImageUrl: item.coverImage?.large || null,
          releaseDate
        };

        let mediaItem;
        if (existingItem) {
          mediaItem = await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data: updateData
          });
        } else {
          mediaItem = await prisma.mediaItem.create({
            data: {
              externalId: String(item.id),
              type,
              ...updateData
            }
          });
        }
        results.push(mediaItem);
      }
      return results;
    } catch (error) {
      console.error(`Error searching ${type} in AniList:`, error.message);
      throw error;
    }
  }

  static async fetchUpcomingSeasonalAnime() {
    const query = `
      query {
        Page(page: 1, perPage: 20) {
          media(status: NOT_YET_RELEASED, type: ANIME, sort: START_DATE) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            startDate {
              year
              month
              day
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, {});
      const results = [];
      
      for (const item of data.Page.media) {
        const title = item.title.english || item.title.romaji;
        let releaseDate = null;
        if (item.startDate && item.startDate.year) {
          releaseDate = new Date(item.startDate.year, (item.startDate.month || 1) - 1, item.startDate.day || 1);
        }

        const existingItem = await prisma.mediaItem.findFirst({
          where: { externalId: String(item.id), type: 'ANIME' }
        });

        const updateData = {
          title,
          synopsis: item.description,
          coverImageUrl: item.coverImage?.large || null,
          releaseDate
        };

        let mediaItem;
        if (existingItem) {
          mediaItem = await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data: updateData
          });
        } else {
          mediaItem = await prisma.mediaItem.create({
            data: {
              externalId: String(item.id),
              type: 'ANIME',
              ...updateData
            }
          });
        }
        results.push(mediaItem);
      }
      return results;
    } catch (error) {
      console.error('Error fetching upcoming seasonal anime:', error.message);
      throw error;
    }
  }
}

module.exports = AniListService;
