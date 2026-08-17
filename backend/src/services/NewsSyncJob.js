const cron = require('node-cron');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({});
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const RSS_FEEDS = [
  { url: 'https://www.animenewsnetwork.com/news/rss.xml', publisher: 'Anime News Network' },
  { url: 'https://feeds.ign.com/ign/news', publisher: 'IGN' }
];

class NewsSyncJob {
  static async fetchAndParseRSS(feedUrl) {
    try {
      const response = await axios.get(feedUrl);
      return parser.parse(response.data);
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
      return null;
    }
  }

  static async runSync() {
    console.log('Starting NewsSyncJob...');
    for (const feed of RSS_FEEDS) {
      const data = await this.fetchAndParseRSS(feed.url);
      if (!data || !data.rss || !data.rss.channel || !data.rss.channel.item) continue;
      
      const items = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
      
      for (const item of items) {
        try {
          const sourceUrl = item.link;
          const headline = item.title;
          let publishedAt = new Date();
          // Always populate current date as per requirements to keep feed fresh
          // if (item.pubDate) {
          //   publishedAt = new Date(item.pubDate);
          // }
          
          let imageUrl = null;
          if (item['media:content'] && item['media:content']['@_url']) {
            imageUrl = item['media:content']['@_url'].replace('http://', 'https://');
          } else if (item.enclosure && item.enclosure['@_url'] && item.enclosure['@_type']?.startsWith('image/')) {
            imageUrl = item.enclosure['@_url'].replace('http://', 'https://');
          }

          const existingArticle = await prisma.newsArticle.findFirst({
            where: { sourceUrl }
          });

          if (!existingArticle) {
            await prisma.newsArticle.create({
              data: {
                headline,
                sourceUrl,
                imageUrl,
                publisher: feed.publisher,
                publishedAt
              }
            });
          }
        } catch (error) {
          console.error(`Error processing news item from ${feed.publisher}:`, error.message);
        }
      }
    }
    console.log('NewsSyncJob completed.');
  }

  static start() {
    cron.schedule('0 * * * *', async () => {
      await this.runSync();
    });
    console.log('NewsSyncJob cron scheduled for hourly execution.');
  }
}

module.exports = NewsSyncJob;
