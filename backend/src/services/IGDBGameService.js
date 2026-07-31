const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({});
const IGDB_API_URL = 'https://api.igdb.com/v4';

class IGDBGameService {
  static getHeaders() {
    return {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${process.env.IGDB_TOKEN}`,
      'Accept': 'application/json',
    };
  }

  static async searchGames(query) {
    try {
      const response = await axios.post(
        `${IGDB_API_URL}/games`,
        `search "${query}"; fields name, summary, cover.url, first_release_date; limit 10;`,
        { headers: this.getHeaders() }
      );
      
      const results = [];
      for (const game of response.data) {
        const existingItem = await prisma.mediaItem.findFirst({
          where: { externalId: String(game.id), type: 'GAME' }
        });
        
        let mediaItem;
        const data = {
          title: game.name,
          synopsis: game.summary || null,
          coverImageUrl: game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : null,
          releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null
        };

        if (existingItem) {
          mediaItem = await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data
          });
        } else {
          mediaItem = await prisma.mediaItem.create({
            data: {
              externalId: String(game.id),
              type: 'GAME',
              ...data
            }
          });
        }
        results.push(mediaItem);
      }
      return results;
    } catch (error) {
      console.error('Error in IGDBGameService.searchGames:', error.message);
      throw error;
    }
  }

  static async fetchUpcomingGames() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const response = await axios.post(
        `${IGDB_API_URL}/release_dates`,
        `fields game.name, game.summary, game.cover.url, date; where date > ${now}; sort date asc; limit 20;`,
        { headers: this.getHeaders() }
      );
      
      const results = [];
      for (const release of response.data) {
        if (!release.game) continue;
        const game = release.game;
        
        const existingItem = await prisma.mediaItem.findFirst({
          where: { externalId: String(game.id), type: 'GAME' }
        });
        
        let mediaItem;
        const data = {
          title: game.name,
          synopsis: game.summary || null,
          coverImageUrl: game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : null,
          releaseDate: release.date ? new Date(release.date * 1000) : null
        };

        if (existingItem) {
          mediaItem = await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data
          });
        } else {
          mediaItem = await prisma.mediaItem.create({
            data: {
              externalId: String(game.id),
              type: 'GAME',
              ...data
            }
          });
        }
        results.push(mediaItem);
      }
      return results;
    } catch (error) {
      console.error('Error in IGDBGameService.fetchUpcomingGames:', error.message);
      throw error;
    }
  }
}

module.exports = IGDBGameService;
